import { Player, Room, RoomStatus, RealtimeMessage, ControllerInputEvent, PLAYER_COLORS } from '../types';

const STORAGE_ROOMS_PREFIX = 'syam_room_';
const STORAGE_PLAYERS_PREFIX = 'syam_players_';
const STORAGE_CURRENT_SESSION = 'syam_active_session';

export class RoomManager {
  private static broadcastChannels: Map<string, BroadcastChannel> = new Map();
  private static eventSources: Map<string, EventSource> = new Map();

  // Helper to normalize room code (e.g. "4821", "SYAM4821", "syam-4821", " SYAM 4821 " -> "SYAM-4821")
  public static normalizeRoomCode(input: string): string {
    let clean = (input || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) return '';
    if (!clean.startsWith('SYAM-')) {
      if (clean.startsWith('SYAM')) {
        clean = 'SYAM-' + clean.slice(4).replace(/^-/, '');
      } else {
        clean = 'SYAM-' + clean;
      }
    }
    return clean;
  }

  // Helper to generate readable 4-digit room code like SYAM-4821
  public static generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SYAM-${randomPart}`;
  }

  // Get or create a local BroadcastChannel for low-latency events
  private static getChannel(roomCode: string): BroadcastChannel | null {
    if (typeof BroadcastChannel === 'undefined') return null;
    const code = this.normalizeRoomCode(roomCode);
    if (!this.broadcastChannels.has(code)) {
      try {
        const channel = new BroadcastChannel(`syam_party_${code}`);
        this.broadcastChannels.set(code, channel);
      } catch {
        return null;
      }
    }
    return this.broadcastChannels.get(code) || null;
  }

  // CREATE ROOM
  public static async createRoom(roomCode: string, hostPlayerId?: string): Promise<Room> {
    const code = this.normalizeRoomCode(roomCode);
    const now = Date.now();
    const newRoom: Room = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `room_${now}`,
      roomCode: code,
      code: code,
      hostPlayerId: hostPlayerId || '',
      status: 'LOBBY',
      currentGameId: null,
      maxPlayers: 8,
      players: [],
      createdAt: now,
      updatedAt: now,
      expiresAt: now + 4 * 60 * 60 * 1000,
    };

    // 1. Save to Server Backend API
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, hostPlayerId, maxPlayers: 8 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(data.room));
          localStorage.setItem(STORAGE_PLAYERS_PREFIX + code, JSON.stringify(data.room.players || []));
          return data.room;
        }
      }
    } catch (err) {
      console.warn('API createRoom fallback to local:', err);
    }

    // 2. Save to LocalStorage fallback
    localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(newRoom));
    localStorage.setItem(STORAGE_PLAYERS_PREFIX + code, JSON.stringify([]));

    return newRoom;
  }

  // GET ROOM
  public static async getRoom(roomCode: string): Promise<Room | null> {
    const rawCode = (roomCode || '').trim().toUpperCase();
    const code = this.normalizeRoomCode(rawCode);
    if (!code) return null;

    // 1. Try Server API
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(data.room));
          localStorage.setItem(STORAGE_PLAYERS_PREFIX + code, JSON.stringify(data.room.players || []));
          return data.room;
        }
      }
    } catch {}

    // 2. Fallback to LocalStorage
    const raw = localStorage.getItem(STORAGE_ROOMS_PREFIX + code) || localStorage.getItem(STORAGE_ROOMS_PREFIX + rawCode);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Room;
      const targetCode = parsed.roomCode || parsed.code || code;
      const players = await this.getPlayers(targetCode);
      parsed.players = players;
      parsed.code = targetCode;
      return parsed;
    } catch {
      return null;
    }
  }

  // GET PLAYERS
  public static async getPlayers(roomCode: string): Promise<Player[]> {
    const rawCode = (roomCode || '').trim().toUpperCase();
    const code = this.normalizeRoomCode(rawCode) || rawCode;
    
    // Check server room
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room && Array.isArray(data.room.players)) {
          return data.room.players;
        }
      }
    } catch {}

    const raw = localStorage.getItem(STORAGE_PLAYERS_PREFIX + code) || localStorage.getItem(STORAGE_PLAYERS_PREFIX + rawCode);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Player[];
      return parsed.map((p) => ({ ...p, isReady: p.isReady ?? p.ready ?? true }));
    } catch {
      return [];
    }
  }

  // SAVE PLAYERS (INTERNAL LOCAL BACKUP)
  private static savePlayers(roomCode: string, players: Player[]) {
    const code = this.normalizeRoomCode(roomCode) || roomCode.toUpperCase();
    localStorage.setItem(STORAGE_PLAYERS_PREFIX + code, JSON.stringify(players));
  }

  // JOIN ROOM
  public static async joinRoom(
    roomCode: string,
    nickname: string,
    avatar: string,
    existingPlayerId?: string
  ): Promise<{ player: Player; room: Room } | { error: string }> {
    const cleanCode = this.normalizeRoomCode(roomCode);
    if (!cleanCode) {
      return { error: 'Kode room tidak boleh kosong.' };
    }

    // 1. Call Server API first
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(cleanCode)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          avatar,
          existingPlayerId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.player && data.room) {
          this.savePlayers(cleanCode, data.room.players || []);
          localStorage.setItem(STORAGE_ROOMS_PREFIX + cleanCode, JSON.stringify(data.room));

          // Broadcast local channel too
          this.broadcast(cleanCode, {
            type: 'PLAYER_JOIN',
            roomId: data.room.id,
            senderId: data.player.id,
            payload: { player: data.player, players: data.room.players, room: data.room },
            timestamp: Date.now(),
          });

          return { player: data.player, room: data.room };
        } else if (data.error) {
          return { error: data.error };
        }
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.error) {
          return { error: errData.error };
        }
      }
    } catch (apiErr) {
      console.warn('Server join API failed, trying local fallback:', apiErr);
    }

    // 2. Local Fallback if server is offline
    let room = await this.getRoom(cleanCode);
    if (!room) {
      // Auto-create for local fallback to prevent friction
      room = await this.createRoom(cleanCode);
    }
    const code = room.code || cleanCode;

    if (room.status === 'CLOSED') {
      return { error: 'Room sudah ditutup.' };
    }

    const players = await this.getPlayers(code);

    // Reconnection check
    if (existingPlayerId) {
      const existing = players.find((p) => p.id === existingPlayerId);
      if (existing) {
        existing.connected = true;
        existing.lastSeen = Date.now();
        if (nickname) existing.nickname = nickname.trim().slice(0, 16);
        if (avatar) existing.avatar = avatar;
        this.savePlayers(code, players);

        room.players = players;
        this.broadcast(code, {
          type: 'PLAYER_JOIN',
          roomId: room.id,
          senderId: existing.id,
          payload: { player: existing, players, room },
          timestamp: Date.now(),
        });

        return { player: existing, room };
      }
    }

    if (players.length >= room.maxPlayers) {
      return { error: 'Room sudah penuh (Maksimal ' + room.maxPlayers + ' pemain).' };
    }

    const playerNumber = players.length + 1;
    const playerColor = PLAYER_COLORS[(playerNumber - 1) % PLAYER_COLORS.length];
    const isFirstPlayer = players.length === 0;

    const newPlayer: Player = {
      id: existingPlayerId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
      roomId: room.id,
      nickname: nickname.trim().slice(0, 16) || `Player ${playerNumber}`,
      avatar: avatar || '😀',
      playerNumber,
      playerColor,
      score: 0,
      partyPoints: 0,
      ready: true,
      isReady: true,
      connected: true,
      isHost: isFirstPlayer || !room.hostPlayerId,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    players.push(newPlayer);
    this.savePlayers(code, players);

    if (!room.hostPlayerId) {
      room.hostPlayerId = newPlayer.id;
    }
    room.players = players;
    localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(room));

    // Broadcast Join Event
    this.broadcast(code, {
      type: 'PLAYER_JOIN',
      roomId: room.id,
      senderId: newPlayer.id,
      payload: { player: newPlayer, players, room },
      timestamp: Date.now(),
    });

    return { player: newPlayer, room };
  }

  // UPDATE PLAYER READY
  public static async setPlayerReady(roomCode: string, playerId: string, ready: boolean) {
    const code = this.normalizeRoomCode(roomCode);
    
    // Server API
    try {
      fetch(`/api/rooms/${encodeURIComponent(code)}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ready }),
      }).catch(() => {});
    } catch {}

    const players = await this.getPlayers(code);
    const target = players.find((p) => p.id === playerId);
    if (target) {
      target.ready = ready;
      target.isReady = ready;
      this.savePlayers(code, players);
      this.broadcast(code, {
        type: 'PLAYER_READY',
        roomId: code,
        senderId: playerId,
        payload: { playerId, ready, players },
        timestamp: Date.now(),
      });
    }
  }

  // UPDATE ROOM STATUS & GAME
  public static async updateRoom(roomCode: string, partial: Partial<Room>) {
    const code = this.normalizeRoomCode(roomCode);

    // Server API
    try {
      fetch(`/api/rooms/${encodeURIComponent(code)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: partial.status,
          currentGameId: partial.currentGameId,
        }),
      }).catch(() => {});
    } catch {}

    const current = await this.getRoom(code);
    if (!current) return;

    const updated = { ...current, ...partial, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(updated));

    this.broadcast(code, {
      type: 'ROOM_UPDATE',
      roomId: updated.id,
      senderId: 'HOST',
      payload: { room: updated, players: updated.players },
      timestamp: Date.now(),
    });
  }

  // UPDATE PARTY POINTS
  public static async updatePartyPoints(
    roomCode: string,
    roundRankings: { playerId: string; rank: number; score: number }[]
  ) {
    const code = this.normalizeRoomCode(roomCode);

    // Server API
    try {
      fetch(`/api/rooms/${encodeURIComponent(code)}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundRankings }),
      }).catch(() => {});
    } catch {}

    const players = await this.getPlayers(code);
    const pointBonuses: { [rank: number]: number } = { 1: 100, 2: 75, 3: 50, 4: 25 };

    players.forEach((p) => {
      const match = roundRankings.find((r) => r.playerId === p.id);
      if (match) {
        p.score = match.score;
        const bonus = pointBonuses[match.rank] || 10;
        p.partyPoints = (p.partyPoints || 0) + bonus;
      }
    });

    this.savePlayers(code, players);
    this.broadcast(code, {
      type: 'PARTY_POINTS_UPDATE',
      roomId: code,
      senderId: 'HOST',
      payload: { players, roundRankings },
      timestamp: Date.now(),
    });

    return players;
  }

  // LEAVE ROOM
  public static async leaveRoom(roomCode: string, playerId: string) {
    const code = this.normalizeRoomCode(roomCode);

    try {
      fetch(`/api/rooms/${encodeURIComponent(code)}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      }).catch(() => {});
    } catch {}

    let players = await this.getPlayers(code);
    const leavingPlayer = players.find((p) => p.id === playerId);
    players = players.filter((p) => p.id !== playerId);
    this.savePlayers(code, players);

    let room = await this.getRoom(code);
    if (room && room.hostPlayerId === playerId) {
      room.hostPlayerId = players.length > 0 ? players[0].id : '';
      if (players.length > 0) {
        players[0].isHost = true;
        this.savePlayers(code, players);
      }
      localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(room));
    }

    this.broadcast(code, {
      type: 'PLAYER_LEAVE',
      roomId: code,
      senderId: playerId,
      payload: { playerId, leavingPlayer, players, newHostId: room?.hostPlayerId },
      timestamp: Date.now(),
    });
  }

  // KICK PLAYER
  public static async kickPlayer(roomCode: string, playerId: string) {
    await this.leaveRoom(roomCode, playerId);
  }

  // BROADCAST MESSAGE (Local BroadcastChannel)
  public static broadcast(roomCode: string, message: RealtimeMessage) {
    const code = this.normalizeRoomCode(roomCode);
    const channel = this.getChannel(code);
    if (channel) {
      try {
        channel.postMessage(message);
      } catch {}
    }
  }

  // SEND CONTROLLER INPUT
  public static sendControllerInput(
    roomCode: string,
    playerId: string,
    gameId: string,
    action: string,
    payload?: any
  ) {
    const code = this.normalizeRoomCode(roomCode);
    const event: ControllerInputEvent = {
      roomId: code,
      playerId,
      gameId,
      action,
      payload,
      timestamp: Date.now(),
    };

    // 1. Send to Server API
    try {
      fetch(`/api/rooms/${encodeURIComponent(code)}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {});
    } catch {}

    // 2. Broadcast to local channel
    this.broadcast(code, {
      type: 'CONTROLLER_INPUT',
      roomId: code,
      senderId: playerId,
      payload: event,
      timestamp: Date.now(),
    });
  }

  // SUBSCRIBE TO ROOM REALTIME EVENTS (SSE + BroadcastChannel + Storage)
  public static subscribe(
    roomCode: string,
    onMessage: (msg: RealtimeMessage) => void
  ): () => void {
    const code = this.normalizeRoomCode(roomCode);
    let eventSource: EventSource | null = null;

    // 1. Connect to Server-Sent Events (SSE) stream
    if (typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource(`/api/rooms/${encodeURIComponent(code)}/events`);
        eventSource.onmessage = (event) => {
          if (!event.data) return;
          try {
            const data = JSON.parse(event.data);
            if (data && typeof data === 'object') {
              onMessage(data as RealtimeMessage);
            }
          } catch {}
        };
        eventSource.onerror = () => {
          // SSE will automatically attempt reconnection
        };
        this.eventSources.set(code, eventSource);
      } catch (err) {
        console.warn('SSE connection error:', err);
      }
    }

    // 2. BroadcastChannel listener (for instant same-browser tabs)
    const channel = this.getChannel(code);
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        onMessage(event.data as RealtimeMessage);
      }
    };
    if (channel) {
      channel.addEventListener('message', handleBroadcast);
    }

    // 3. Cross-tab storage event listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_PLAYERS_PREFIX + code && e.newValue) {
        try {
          const players = JSON.parse(e.newValue);
          onMessage({
            type: 'ROOM_UPDATE',
            roomId: code,
            senderId: 'SYSTEM',
            payload: { players },
            timestamp: Date.now(),
          });
        } catch {}
      }
      if (e.key === STORAGE_ROOMS_PREFIX + code && e.newValue) {
        try {
          const room = JSON.parse(e.newValue);
          onMessage({
            type: 'ROOM_UPDATE',
            roomId: code,
            senderId: 'SYSTEM',
            payload: { room },
            timestamp: Date.now(),
          });
        } catch {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    // Cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
        this.eventSources.delete(code);
      }
      if (channel) {
        channel.removeEventListener('message', handleBroadcast);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }
}

/**
 * Stateful client-side room manager for App.tsx
 */
class ClientRoomManager {
  private currentRoom: Room | null = null;
  private currentPlayerId: string | null = null;
  private roomListeners: ((room: Room | null) => void)[] = [];
  private inputListeners: ((event: ControllerInputEvent) => void)[] = [];
  private unsubCurrentRoom: (() => void) | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const raw = localStorage.getItem(STORAGE_CURRENT_SESSION);
      if (raw) {
        const { roomCode, playerId } = JSON.parse(raw);
        if (roomCode) {
          RoomManager.getRoom(roomCode).then((r) => {
            if (r) {
              this.currentRoom = r;
              this.currentPlayerId = playerId || null;
              this.subscribeToActiveRoom(roomCode);
              this.notifyRoom();
            }
          });
        }
      }
    } catch {}
  }

  private saveSession(roomCode: string, playerId: string) {
    localStorage.setItem(STORAGE_CURRENT_SESSION, JSON.stringify({ roomCode, playerId }));
  }

  private clearSession() {
    localStorage.removeItem(STORAGE_CURRENT_SESSION);
  }

  private subscribeToActiveRoom(roomCode: string) {
    if (this.unsubCurrentRoom) {
      this.unsubCurrentRoom();
      this.unsubCurrentRoom = null;
    }

    this.unsubCurrentRoom = RoomManager.subscribe(roomCode, (msg) => {
      if (
        msg.type === 'PLAYER_JOIN' ||
        msg.type === 'ROOM_UPDATE' ||
        msg.type === 'PARTY_POINTS_UPDATE' ||
        msg.type === 'PLAYER_READY' ||
        msg.type === 'PLAYER_LEAVE' ||
        msg.type === 'INIT'
      ) {
        // If message has payload with room/players, update immediately
        if (msg.payload && msg.payload.room) {
          this.currentRoom = msg.payload.room;
          if (msg.payload.players) {
            this.currentRoom!.players = msg.payload.players;
          }
          this.notifyRoom();
        } else {
          RoomManager.getRoom(roomCode).then((r) => {
            if (r) {
              this.currentRoom = r;
              this.notifyRoom();
            }
          });
        }
      }

      if (msg.type === 'CONTROLLER_INPUT' && msg.payload) {
        this.inputListeners.forEach((fn) => fn(msg.payload as ControllerInputEvent));
      }
    });
  }

  private notifyRoom() {
    this.roomListeners.forEach((fn) => fn(this.currentRoom));
  }

  public onRoomUpdated(callback: (room: Room | null) => void): () => void {
    this.roomListeners.push(callback);
    callback(this.currentRoom);
    return () => {
      this.roomListeners = this.roomListeners.filter((fn) => fn !== callback);
    };
  }

  public onInputReceived(callback: (event: ControllerInputEvent) => void): () => void {
    this.inputListeners.push(callback);
    return () => {
      this.inputListeners = this.inputListeners.filter((fn) => fn !== callback);
    };
  }

  public getRoom(): Room | null {
    return this.currentRoom;
  }

  public getCurrentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  public async createRoom(nickname: string = 'Host TV', avatar: string = '📺'): Promise<Room> {
    const code = RoomManager.generateRoomCode();
    const newRoom = await RoomManager.createRoom(code);
    const joinRes = await RoomManager.joinRoom(code, nickname, avatar);
    
    if ('player' in joinRes) {
      this.currentPlayerId = joinRes.player.id;
      this.currentRoom = joinRes.room;
      this.saveSession(code, joinRes.player.id);
      this.subscribeToActiveRoom(code);
      this.notifyRoom();
      return joinRes.room;
    }

    this.currentRoom = newRoom;
    this.saveSession(code, '');
    this.subscribeToActiveRoom(code);
    this.notifyRoom();
    return newRoom;
  }

  public async joinRoom(
    code: string,
    nickname: string,
    avatar: string
  ): Promise<{ success: boolean; room?: Room; player?: Player; error?: string }> {
    const cleanCode = RoomManager.normalizeRoomCode(code);
    const res = await RoomManager.joinRoom(cleanCode, nickname, avatar, this.currentPlayerId || undefined);
    if ('player' in res) {
      this.currentPlayerId = res.player.id;
      this.currentRoom = res.room;
      this.saveSession(cleanCode, res.player.id);
      this.subscribeToActiveRoom(cleanCode);
      this.notifyRoom();
      return { success: true, room: res.room, player: res.player };
    }
    return { success: false, error: res.error || 'Gagal bergabung ke room.' };
  }

  public async startGame(gameId: string): Promise<void> {
    if (!this.currentRoom) return;
    const code = this.currentRoom.code || this.currentRoom.roomCode;
    await RoomManager.updateRoom(code, {
      status: 'IN_GAME',
      currentGameId: gameId,
    });
    this.currentRoom = await RoomManager.getRoom(code);
    this.notifyRoom();
  }

  public async setGameStatus(status: RoomStatus): Promise<void> {
    if (!this.currentRoom) return;
    const code = this.currentRoom.code || this.currentRoom.roomCode;
    await RoomManager.updateRoom(code, { status });
    this.currentRoom = await RoomManager.getRoom(code);
    this.notifyRoom();
  }

  public sendInput(action: string, payload?: any) {
    if (!this.currentRoom || !this.currentPlayerId) return;
    const code = this.currentRoom.code || this.currentRoom.roomCode;
    RoomManager.sendControllerInput(
      code,
      this.currentPlayerId,
      this.currentRoom.currentGameId || 'game',
      action,
      payload
    );
  }

  public setPlayerReady(ready: boolean) {
    if (!this.currentRoom || !this.currentPlayerId) return;
    const code = this.currentRoom.code || this.currentRoom.roomCode;
    RoomManager.setPlayerReady(code, this.currentPlayerId, ready);
  }

  public kickPlayer(playerId: string) {
    if (!this.currentRoom) return;
    const code = this.currentRoom.code || this.currentRoom.roomCode;
    RoomManager.kickPlayer(code, playerId);
  }

  public leaveRoom() {
    if (this.currentRoom && this.currentPlayerId) {
      const code = this.currentRoom.code || this.currentRoom.roomCode;
      RoomManager.leaveRoom(code, this.currentPlayerId);
    }
    if (this.unsubCurrentRoom) {
      this.unsubCurrentRoom();
      this.unsubCurrentRoom = null;
    }
    this.currentRoom = null;
    this.currentPlayerId = null;
    this.clearSession();
    this.notifyRoom();
  }

  public async updatePlayerScore(playerId: string, scoreBonus: number) {
    if (!this.currentRoom) return;
    const code = this.currentRoom.code || this.currentRoom.roomCode;
    const players = await RoomManager.getPlayers(code);
    const p = players.find((pl) => pl.id === playerId);
    if (p) {
      p.score = (p.score || 0) + scoreBonus;
      p.partyPoints = (p.partyPoints || 0) + scoreBonus;
      await RoomManager.updatePartyPoints(code, [{ playerId, rank: 1, score: p.score }]);
    }
  }
}

export const roomManager = new ClientRoomManager();
