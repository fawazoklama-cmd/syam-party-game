import { Player, Room, RoomStatus, RealtimeMessage, ControllerInputEvent, PLAYER_COLORS } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_ROOMS_PREFIX = 'syam_room_';
const STORAGE_PLAYERS_PREFIX = 'syam_players_';
const STORAGE_CURRENT_SESSION = 'syam_active_session';

export class RoomManager {
  private static broadcastChannels: Map<string, BroadcastChannel> = new Map();

  // Helper to generate readable 4-digit room code like SYAM-4821
  public static generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SYAM-${randomPart}`;
  }

  // Get or create a local BroadcastChannel for low-latency zero-lag events
  private static getChannel(roomCode: string): BroadcastChannel {
    const code = roomCode.toUpperCase();
    if (!this.broadcastChannels.has(code)) {
      const channel = new BroadcastChannel(`syam_party_${code}`);
      this.broadcastChannels.set(code, channel);
    }
    return this.broadcastChannels.get(code)!;
  }

  // CREATE ROOM
  public static async createRoom(roomCode: string, hostPlayerId?: string): Promise<Room> {
    const code = roomCode.toUpperCase();
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

    // Save to LocalStorage
    localStorage.setItem(STORAGE_ROOMS_PREFIX + code, JSON.stringify(newRoom));
    localStorage.setItem(STORAGE_PLAYERS_PREFIX + code, JSON.stringify([]));

    // If Supabase configured, save to database
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('rooms').upsert({
          id: newRoom.id,
          room_code: newRoom.roomCode,
          status: newRoom.status,
          max_players: newRoom.maxPlayers,
          created_at: new Date(newRoom.createdAt).toISOString(),
          updated_at: new Date(newRoom.updatedAt).toISOString(),
        });
      } catch (err) {
        console.warn('Supabase createRoom warning:', err);
      }
    }

    return newRoom;
  }

  // GET ROOM
  public static async getRoom(roomCode: string): Promise<Room | null> {
    const code = roomCode.toUpperCase();
    
    // Check Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('rooms').select('*').eq('room_code', code).single();
        if (data) {
          const players = await this.getPlayers(code);
          return {
            id: data.id,
            roomCode: data.room_code,
            code: data.room_code,
            hostPlayerId: data.host_player_id || '',
            status: data.status as RoomStatus,
            currentGameId: data.current_game_id,
            maxPlayers: data.max_players,
            players,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
            expiresAt: new Date(data.expires_at || Date.now() + 14400000).getTime(),
          };
        }
      } catch {}
    }

    // Fallback to local storage
    const raw = localStorage.getItem(STORAGE_ROOMS_PREFIX + code);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Room;
      const players = await this.getPlayers(code);
      parsed.players = players;
      parsed.code = parsed.roomCode || code;
      return parsed;
    } catch {
      return null;
    }
  }

  // GET PLAYERS
  public static async getPlayers(roomCode: string): Promise<Player[]> {
    const code = roomCode.toUpperCase();
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('players').select('*').eq('room_id', code);
        if (data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            roomId: d.room_id,
            nickname: d.nickname,
            avatar: d.avatar,
            playerNumber: d.player_number,
            playerColor: d.player_color,
            score: d.score,
            partyPoints: d.party_points,
            ready: d.ready,
            isReady: d.ready,
            connected: d.connected,
            joinedAt: new Date(d.created_at).getTime(),
            lastSeen: new Date(d.last_seen).getTime(),
          }));
        }
      } catch {}
    }

    const raw = localStorage.getItem(STORAGE_PLAYERS_PREFIX + code);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Player[];
      return parsed.map((p) => ({ ...p, isReady: p.isReady ?? p.ready ?? true }));
    } catch {
      return [];
    }
  }

  // SAVE PLAYERS (INTERNAL)
  private static savePlayers(roomCode: string, players: Player[]) {
    const code = roomCode.toUpperCase();
    localStorage.setItem(STORAGE_PLAYERS_PREFIX + code, JSON.stringify(players));
  }

  // JOIN ROOM
  public static async joinRoom(
    roomCode: string,
    nickname: string,
    avatar: string,
    existingPlayerId?: string
  ): Promise<{ player: Player; room: Room } | { error: string }> {
    const code = roomCode.toUpperCase().trim();
    let room = await this.getRoom(code);
    if (!room) {
      return { error: 'Room tidak ditemukan. Periksa kembali Room Code.' };
    }

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

    // If room had no host, set as host
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
    const code = roomCode.toUpperCase();
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
    const code = roomCode.toUpperCase();
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
    const code = roomCode.toUpperCase();
    const players = await this.getPlayers(code);

    const pointBonuses: { [rank: number]: number } = {
      1: 100,
      2: 75,
      3: 50,
      4: 25,
    };

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
    const code = roomCode.toUpperCase();
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

  // BROADCAST MESSAGE
  public static broadcast(roomCode: string, message: RealtimeMessage) {
    const code = roomCode.toUpperCase();
    const channel = this.getChannel(code);
    try {
      channel.postMessage(message);
    } catch {}

    // If Supabase realtime channel active
    if (isSupabaseConfigured && supabase) {
      try {
        const sbChannel = supabase.channel(`room_${code}`);
        sbChannel.send({
          type: 'broadcast',
          event: message.type,
          payload: message,
        });
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
    const event: ControllerInputEvent = {
      roomId: roomCode.toUpperCase(),
      playerId,
      gameId,
      action,
      payload,
      timestamp: Date.now(),
    };

    this.broadcast(roomCode, {
      type: 'CONTROLLER_INPUT',
      roomId: roomCode.toUpperCase(),
      senderId: playerId,
      payload: event,
      timestamp: Date.now(),
    });
  }

  // SUBSCRIBE TO ROOM
  public static subscribe(
    roomCode: string,
    onMessage: (msg: RealtimeMessage) => void
  ): () => void {
    const code = roomCode.toUpperCase();
    const channel = this.getChannel(code);

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        onMessage(event.data as RealtimeMessage);
      }
    };

    channel.addEventListener('message', handleBroadcast);

    // Cross-tab storage event listener
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

    window.addEventListener('storage', handleStorage);

    // Cleanup function
    return () => {
      channel.removeEventListener('message', handleBroadcast);
      window.removeEventListener('storage', handleStorage);
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
      if (msg.type === 'PLAYER_JOIN' || msg.type === 'ROOM_UPDATE' || msg.type === 'PARTY_POINTS_UPDATE' || msg.type === 'PLAYER_READY' || msg.type === 'PLAYER_LEAVE') {
        RoomManager.getRoom(roomCode).then((r) => {
          if (r) {
            this.currentRoom = r;
            this.notifyRoom();
          }
        });
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

  public async joinRoom(code: string, nickname: string, avatar: string): Promise<Room | null> {
    const res = await RoomManager.joinRoom(code, nickname, avatar, this.currentPlayerId || undefined);
    if ('player' in res) {
      this.currentPlayerId = res.player.id;
      this.currentRoom = res.room;
      this.saveSession(code, res.player.id);
      this.subscribeToActiveRoom(code);
      this.notifyRoom();
      return res.room;
    }
    return null;
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
