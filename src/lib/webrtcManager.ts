import { ControllerInputEvent } from '../types';

export type ConnectionQuality = 'disconnected' | 'connecting' | 'sse_fallback' | 'webrtc_connected';

export interface WebRTCStatus {
  quality: ConnectionQuality;
  mode: 'host' | 'controller' | 'idle';
  connectedPeersCount: number;
  rttMs: number | null;
  channelState: RTCDataChannelState | 'closed';
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

export class WebRTCManager {
  private static instance: WebRTCManager | null = null;

  private isHost: boolean = false;
  private roomCode: string = '';
  private myPlayerId: string = '';
  private hostPlayerId: string = '';

  // Peer connections: PeerID -> RTCPeerConnection
  private peers: Map<string, RTCPeerConnection> = new Map();
  // Data channels: PeerID -> RTCDataChannel
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  // Fast Unreliable Data channels for analog/motion: PeerID -> RTCDataChannel
  private fastDataChannels: Map<string, RTCDataChannel> = new Map();

  // Callbacks
  private onInputCallback: ((event: ControllerInputEvent) => void) | null = null;
  private onStatusChangeCallbacks: Set<(status: WebRTCStatus) => void> = new Set();

  private pingInterval: any = null;
  private lastPingSentTime: number = 0;
  private currentRtt: number | null = null;

  public static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager();
    }
    return WebRTCManager.instance;
  }

  // Initialize Host or Controller WebRTC node
  public init(
    roomCode: string,
    myPlayerId: string,
    isHost: boolean,
    hostPlayerId?: string
  ) {
    this.cleanup();
    this.roomCode = roomCode;
    this.myPlayerId = myPlayerId;
    this.isHost = isHost;
    this.hostPlayerId = hostPlayerId || (isHost ? myPlayerId : '');

    this.emitStatus();

    if (!isHost && this.hostPlayerId && this.hostPlayerId !== this.myPlayerId) {
      // As a controller, initiate connection to host
      this.initiateConnectionToHost();
    }

    // Start periodic RTT Ping
    this.startPingLoop();
  }

  // Check if WebRTC is available in current browser
  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof RTCPeerConnection !== 'undefined' &&
      typeof RTCDataChannel !== 'undefined'
    );
  }

  // Set Input Handler for Host
  public setInputCallback(callback: (event: ControllerInputEvent) => void) {
    this.onInputCallback = callback;
  }

  // Subscribe to status changes
  public onStatusChange(callback: (status: WebRTCStatus) => void): () => void {
    this.onStatusChangeCallbacks.add(callback);
    callback(this.getStatus());
    return () => {
      this.onStatusChangeCallbacks.delete(callback);
    };
  }

  public getStatus(): WebRTCStatus {
    const connectedChannels = Array.from(this.dataChannels.values()).filter(
      (dc) => dc.readyState === 'open'
    );

    let quality: ConnectionQuality = 'disconnected';
    if (connectedChannels.length > 0) {
      quality = 'webrtc_connected';
    } else if (this.peers.size > 0) {
      quality = 'connecting';
    } else if (this.roomCode) {
      quality = 'sse_fallback';
    }

    const firstDc = connectedChannels[0];

    return {
      quality,
      mode: this.isHost ? 'host' : this.myPlayerId ? 'controller' : 'idle',
      connectedPeersCount: connectedChannels.length,
      rttMs: this.currentRtt,
      channelState: firstDc ? firstDc.readyState : 'closed',
    };
  }

  private emitStatus() {
    const status = this.getStatus();
    this.onStatusChangeCallbacks.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
  }

  // CONTROLLER: Initiate connection to TV Host
  public async initiateConnectionToHost() {
    if (!this.isSupported() || !this.hostPlayerId || this.isHost) return;

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      this.peers.set(this.hostPlayerId, pc);

      // 1. Create reliable channel for button triggers & state
      const reliableDc = pc.createDataChannel('game_reliable', {
        ordered: true,
      });
      this.setupDataChannel(this.hostPlayerId, reliableDc, false);

      // 2. Create high-frequency unreliable channel for joystick/sliders
      const fastDc = pc.createDataChannel('game_fast', {
        ordered: false,
        maxRetransmits: 0,
      });
      this.setupDataChannel(this.hostPlayerId, fastDc, true);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal('ice-candidate', event.candidate, this.hostPlayerId);
        }
      };

      pc.onconnectionstatechange = () => {
        this.emitStatus();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.sendSignal('offer', offer, this.hostPlayerId);
      this.emitStatus();
    } catch (err) {
      console.warn('[WebRTC] initiateConnectionToHost failed, using SSE fallback:', err);
    }
  }

  // HOST: Handle incoming signal from Controller
  public async handleSignal(signal: {
    senderId: string;
    targetId?: string;
    signalType: string;
    data: any;
  }) {
    if (!this.isSupported()) return;
    if (signal.senderId === this.myPlayerId) return; // ignore own signals
    if (signal.targetId && signal.targetId !== 'ALL' && signal.targetId !== this.myPlayerId) {
      return; // not for me
    }

    const peerId = signal.senderId;

    try {
      if (signal.signalType === 'offer' && this.isHost) {
        let pc = this.peers.get(peerId);
        if (!pc) {
          pc = new RTCPeerConnection(ICE_SERVERS);
          this.peers.set(peerId, pc);

          pc.ondatachannel = (event) => {
            const dc = event.channel;
            const isFast = dc.label === 'game_fast';
            this.setupDataChannel(peerId, dc, isFast);
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              this.sendSignal('ice-candidate', event.candidate, peerId);
            }
          };

          pc.onconnectionstatechange = () => {
            this.emitStatus();
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSignal('answer', answer, peerId);
        this.emitStatus();
      } else if (signal.signalType === 'answer') {
        const pc = this.peers.get(peerId);
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          this.emitStatus();
        }
      } else if (signal.signalType === 'ice-candidate') {
        const pc = this.peers.get(peerId);
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
          } catch (e) {
            console.warn('[WebRTC] addIceCandidate error:', e);
          }
        }
      } else if (signal.signalType === 'ping') {
        // Send immediate pong back
        this.sendSignal('pong', { clientTimestamp: signal.data.clientTimestamp }, peerId);
      } else if (signal.signalType === 'pong') {
        if (signal.data?.clientTimestamp) {
          this.currentRtt = Math.max(1, Date.now() - signal.data.clientTimestamp);
          this.emitStatus();
        }
      }
    } catch (err) {
      console.warn('[WebRTC] handleSignal error:', err);
    }
  }

  // Setup DataChannel listeners
  private setupDataChannel(peerId: string, dc: RTCDataChannel, isFast: boolean = false) {
    if (isFast) {
      this.fastDataChannels.set(peerId, dc);
    } else {
      this.dataChannels.set(peerId, dc);
    }

    dc.onopen = () => {
      this.emitStatus();
    };

    dc.onclose = () => {
      this.emitStatus();
    };

    dc.onerror = () => {
      this.emitStatus();
    };

    dc.onmessage = (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : '';
        if (!raw) return;

        const payload = JSON.parse(raw);

        if (payload._type === 'PING') {
          // Send pong back immediately
          try {
            dc.send(JSON.stringify({ _type: 'PONG', t: payload.t }));
          } catch {}
          return;
        }

        if (payload._type === 'PONG') {
          if (payload.t) {
            this.currentRtt = Math.max(1, Date.now() - payload.t);
            this.emitStatus();
          }
          return;
        }

        // It is a game input event!
        if (this.onInputCallback && payload.action) {
          this.onInputCallback(payload as ControllerInputEvent);
        }
      } catch (err) {
        console.warn('[WebRTC] parse message error:', err);
      }
    };
  }

  // Send input over WebRTC if connected, returns boolean success
  public sendInputDirect(event: ControllerInputEvent): boolean {
    const targetPeerId = this.hostPlayerId || 'HOST';
    
    // Choose fast channel for continuous motion/sliders, or reliable for discrete buttons
    const isMotionAction = ['MOVE', 'STEER', 'PADDLE', 'JOYSTICK', 'SLIDER', 'DRAW'].includes(
      event.action
    );

    const dc = isMotionAction
      ? this.fastDataChannels.get(targetPeerId) || this.dataChannels.get(targetPeerId)
      : this.dataChannels.get(targetPeerId) || this.fastDataChannels.get(targetPeerId);

    if (dc && dc.readyState === 'open') {
      try {
        dc.send(JSON.stringify(event));
        return true;
      } catch {
        return false;
      }
    }

    // Try any open channel
    for (const [_, openDc] of this.dataChannels) {
      if (openDc.readyState === 'open') {
        try {
          openDc.send(JSON.stringify(event));
          return true;
        } catch {}
      }
    }

    return false;
  }

  // Send signaling packet to server
  private sendSignal(signalType: string, data: any, targetId?: string) {
    if (!this.roomCode) return;
    try {
      fetch(`/api/rooms/${encodeURIComponent(this.roomCode)}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: this.myPlayerId,
          targetId: targetId || 'ALL',
          signalType,
          data,
        }),
      }).catch(() => {});
    } catch {}
  }

  // Ping loop for real-time RTT measurement
  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.dataChannels.size === 0 && this.fastDataChannels.size === 0) return;

      const pingMsg = JSON.stringify({ _type: 'PING', t: Date.now() });
      for (const [_, dc] of this.dataChannels) {
        if (dc.readyState === 'open') {
          try {
            dc.send(pingMsg);
          } catch {}
        }
      }
    }, 2500);
  }

  // Clean up all connections
  public cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    for (const [_, dc] of this.dataChannels) {
      try {
        dc.close();
      } catch {}
    }
    this.dataChannels.clear();

    for (const [_, fdc] of this.fastDataChannels) {
      try {
        fdc.close();
      } catch {}
    }
    this.fastDataChannels.clear();

    for (const [_, pc] of this.peers) {
      try {
        pc.close();
      } catch {}
    }
    this.peers.clear();

    this.roomCode = '';
    this.myPlayerId = '';
    this.isHost = false;
    this.hostPlayerId = '';
    this.currentRtt = null;
    this.emitStatus();
  }
}

export const webrtcManager = WebRTCManager.getInstance();
