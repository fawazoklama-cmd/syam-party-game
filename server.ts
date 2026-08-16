import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface Player {
  id: string;
  roomId: string;
  nickname: string;
  avatar: string;
  playerNumber: number;
  playerColor: string;
  score: number;
  partyPoints: number;
  ready: boolean;
  isReady?: boolean;
  connected: boolean;
  isHost?: boolean;
  joinedAt: number;
  lastSeen: number;
}

interface Room {
  id: string;
  roomCode: string;
  code: string;
  hostPlayerId: string;
  status: 'LOBBY' | 'SELECTING' | 'IN_GAME' | 'ROUND_END' | 'GAME_OVER' | 'CLOSED';
  currentGameId: string | null;
  maxPlayers: number;
  players: Player[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

// In-Memory Storage for High-Speed Realtime Multi-Device Sync
const rooms = new Map<string, Room>();
const sseClients = new Map<string, Set<Response>>();

const PLAYER_COLORS = [
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
];

// Helper to normalize room code (e.g. "4821", "SYAM4821", "syam-4821" -> "SYAM-4821")
function normalizeRoomCode(input: string): string {
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

// Find room by normalized code or raw code
function findRoom(inputCode: string): Room | null {
  const norm = normalizeRoomCode(inputCode);
  if (rooms.has(norm)) return rooms.get(norm)!;
  const raw = (inputCode || '').trim().toUpperCase();
  if (rooms.has(raw)) return rooms.get(raw)!;
  for (const [key, r] of rooms.entries()) {
    if (key.endsWith(raw) || r.roomCode.endsWith(raw) || r.code.endsWith(raw)) {
      return r;
    }
  }
  return null;
}

// Helper to broadcast SSE event to all connected clients of a room
function broadcastToRoom(roomCode: string, type: string, payload: any, senderId: string = 'SERVER') {
  const code = normalizeRoomCode(roomCode);
  const clients = sseClients.get(code);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify({
    type,
    roomId: code,
    senderId,
    payload,
    timestamp: Date.now(),
  });

  const message = `event: message\ndata: ${data}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

// Clean up expired rooms every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.expiresAt && now > room.expiresAt) {
      rooms.delete(code);
      sseClients.delete(code);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS headers for seamless cross-origin and local device access
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now(), activeRooms: rooms.size });
  });

  // 1. Create Room
  app.post('/api/rooms', (req, res) => {
    const { roomCode, hostPlayerId, maxPlayers } = req.body || {};
    const code = normalizeRoomCode(roomCode || '');
    if (!code) {
      res.status(400).json({ error: 'Kode room tidak valid' });
      return;
    }

    const now = Date.now();
    const newRoom: Room = {
      id: `room_${now}_${Math.random().toString(36).substring(2, 7)}`,
      roomCode: code,
      code: code,
      hostPlayerId: hostPlayerId || '',
      status: 'LOBBY',
      currentGameId: null,
      maxPlayers: maxPlayers || 8,
      players: [],
      createdAt: now,
      updatedAt: now,
      expiresAt: now + 4 * 60 * 60 * 1000,
    };

    rooms.set(code, newRoom);
    res.json({ success: true, room: newRoom });
  });

  // 2. Get Room
  app.get('/api/rooms/:code', (req, res) => {
    const rawCode = req.params.code;
    const room = findRoom(rawCode);
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan atau sudah kedaluwarsa' });
      return;
    }
    res.json({ success: true, room });
  });

  // 3. Join Room
  app.post('/api/rooms/:code/join', (req, res) => {
    const rawCode = req.params.code;
    const { nickname, avatar, existingPlayerId } = req.body || {};
    let room = findRoom(rawCode);
    const code = room ? room.code : normalizeRoomCode(rawCode);

    // Auto-create room if it doesn't exist yet (very forgiving for player convenience)
    if (!room) {
      const now = Date.now();
      room = {
        id: `room_${now}_${Math.random().toString(36).substring(2, 7)}`,
        roomCode: code,
        code: code,
        hostPlayerId: '',
        status: 'LOBBY',
        currentGameId: null,
        maxPlayers: 8,
        players: [],
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 4 * 60 * 60 * 1000,
      };
      rooms.set(code, room);
    }

    if (room.status === 'CLOSED') {
      res.status(400).json({ error: 'Room sudah ditutup.' });
      return;
    }

    // Check reconnection or existing player
    if (existingPlayerId) {
      const existing = room.players.find((p) => p.id === existingPlayerId);
      if (existing) {
        existing.connected = true;
        existing.lastSeen = Date.now();
        if (nickname) existing.nickname = nickname.trim().slice(0, 16);
        if (avatar) existing.avatar = avatar;
        room.updatedAt = Date.now();

        broadcastToRoom(code, 'PLAYER_JOIN', { player: existing, players: room.players, room }, existing.id);
        res.json({ success: true, player: existing, room });
        return;
      }
    }

    if (room.players.length >= room.maxPlayers) {
      res.status(400).json({ error: `Room sudah penuh (Maksimal ${room.maxPlayers} pemain).` });
      return;
    }

    const playerNumber = room.players.length + 1;
    const playerColor = PLAYER_COLORS[(playerNumber - 1) % PLAYER_COLORS.length];
    const isFirstPlayer = room.players.length === 0;

    const newPlayer: Player = {
      id: existingPlayerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId: room.id,
      nickname: (nickname || `Player ${playerNumber}`).trim().slice(0, 16),
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

    room.players.push(newPlayer);
    if (!room.hostPlayerId) {
      room.hostPlayerId = newPlayer.id;
    }
    room.updatedAt = Date.now();

    broadcastToRoom(code, 'PLAYER_JOIN', { player: newPlayer, players: room.players, room }, newPlayer.id);
    res.json({ success: true, player: newPlayer, room });
  });

  // 3b. Update Player Profile (Nickname / Avatar in Lobby)
  app.post('/api/rooms/:code/player/profile', (req, res) => {
    const rawCode = req.params.code;
    const { playerId, nickname, avatar } = req.body || {};
    const room = findRoom(rawCode);
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan' });
      return;
    }

    const target = room.players.find((p) => p.id === playerId);
    if (target) {
      if (nickname) target.nickname = nickname.trim().slice(0, 16);
      if (avatar) target.avatar = avatar;
      target.lastSeen = Date.now();
      room.updatedAt = Date.now();

      broadcastToRoom(room.code, 'PLAYER_PROFILE_UPDATE', { player: target, players: room.players }, playerId);
      res.json({ success: true, player: target, room });
      return;
    }

    res.status(404).json({ error: 'Pemain tidak ditemukan dalam room ini' });
  });

  // 4. Update Player Ready
  app.post('/api/rooms/:code/ready', (req, res) => {
    const code = normalizeRoomCode(req.params.code);
    const { playerId, ready } = req.body || {};
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan' });
      return;
    }

    const target = room.players.find((p) => p.id === playerId);
    if (target) {
      target.ready = Boolean(ready);
      target.isReady = Boolean(ready);
      target.lastSeen = Date.now();
      room.updatedAt = Date.now();

      broadcastToRoom(code, 'PLAYER_READY', { playerId, ready: target.ready, players: room.players }, playerId);
    }
    res.json({ success: true, room });
  });

  // 5. Update Room Status / Game
  app.post('/api/rooms/:code/status', (req, res) => {
    const code = normalizeRoomCode(req.params.code);
    const { status, currentGameId } = req.body || {};
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan' });
      return;
    }

    if (status) room.status = status;
    if (currentGameId !== undefined) room.currentGameId = currentGameId;
    room.updatedAt = Date.now();

    broadcastToRoom(code, 'ROOM_UPDATE', { room, players: room.players }, 'HOST');
    res.json({ success: true, room });
  });

  // 6. Send Controller Input
  app.post('/api/rooms/:code/input', (req, res) => {
    const code = normalizeRoomCode(req.params.code);
    const { playerId, gameId, action, payload } = req.body || {};

    const inputEvent = {
      roomId: code,
      playerId,
      gameId: gameId || 'game',
      action,
      payload,
      timestamp: Date.now(),
    };

    broadcastToRoom(code, 'CONTROLLER_INPUT', inputEvent, playerId);
    res.json({ success: true });
  });

  // 7. WebRTC Signaling (Offers, Answers, ICE Candidates)
  app.post('/api/rooms/:code/signal', (req, res) => {
    const code = normalizeRoomCode(req.params.code);
    const { senderId, targetId, signalType, data } = req.body || {};

    if (!signalType || !data) {
      res.status(400).json({ error: 'Data signal WebRTC tidak lengkap' });
      return;
    }

    const signalMessage = {
      type: 'WEBRTC_SIGNAL',
      roomId: code,
      senderId: senderId || 'UNKNOWN',
      targetId: targetId || 'ALL',
      signalType, // 'offer' | 'answer' | 'ice-candidate' | 'ping' | 'pong'
      data,
      timestamp: Date.now(),
    };

    broadcastToRoom(code, 'WEBRTC_SIGNAL', signalMessage, senderId);
    res.json({ success: true });
  });

  // 8. Update Score / Party Points
  app.post('/api/rooms/:code/score', (req, res) => {
    const code = normalizeRoomCode(req.params.code);
    const { roundRankings, playerId, scoreBonus } = req.body || {};
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan' });
      return;
    }

    if (Array.isArray(roundRankings)) {
      const pointBonuses: { [rank: number]: number } = { 1: 100, 2: 75, 3: 50, 4: 25 };
      room.players.forEach((p) => {
        const match = roundRankings.find((r) => r.playerId === p.id);
        if (match) {
          p.score = match.score;
          const bonus = pointBonuses[match.rank] || 10;
          p.partyPoints = (p.partyPoints || 0) + bonus;
        }
      });
    } else if (playerId && typeof scoreBonus === 'number') {
      const p = room.players.find((pl) => pl.id === playerId);
      if (p) {
        p.score = (p.score || 0) + scoreBonus;
        p.partyPoints = (p.partyPoints || 0) + scoreBonus;
      }
    }

    room.updatedAt = Date.now();
    broadcastToRoom(code, 'PARTY_POINTS_UPDATE', { players: room.players, roundRankings }, 'HOST');
    res.json({ success: true, players: room.players, room });
  });

  // 8. Leave Room
  app.post('/api/rooms/:code/leave', (req, res) => {
    const code = normalizeRoomCode(req.params.code);
    const { playerId } = req.body || {};
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Room tidak ditemukan' });
      return;
    }

    const leavingPlayer = room.players.find((p) => p.id === playerId);
    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.hostPlayerId === playerId) {
      room.hostPlayerId = room.players.length > 0 ? room.players[0].id : '';
      if (room.players.length > 0) {
        room.players[0].isHost = true;
      }
    }
    room.updatedAt = Date.now();

    broadcastToRoom(code, 'PLAYER_LEAVE', { playerId, leavingPlayer, players: room.players, newHostId: room.hostPlayerId }, playerId);
    res.json({ success: true, room });
  });

  // 9. Realtime Server-Sent Events (SSE) Stream
  app.get('/api/rooms/:code/events', (req, res) => {
    const code = normalizeRoomCode(req.params.code);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    if (!sseClients.has(code)) {
      sseClients.set(code, new Set());
    }
    sseClients.get(code)!.add(res);

    // Initial handshake
    const room = rooms.get(code);
    const initData = JSON.stringify({
      type: 'INIT',
      roomId: code,
      payload: { room: room || null, players: room?.players || [] },
      timestamp: Date.now(),
    });
    res.write(`event: message\ndata: ${initData}\n\n`);

    // Keep-alive heartbeat every 15s to prevent timeouts on mobile proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const set = sseClients.get(code);
      if (set) {
        set.delete(res);
        if (set.size === 0) sseClients.delete(code);
      }
    });
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SYAM Party Game server running on port ${PORT}`);
  });
}

startServer();
