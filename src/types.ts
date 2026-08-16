/**
 * SYAM PARTY GAME — Master TypeScript Types & Interfaces
 */

export type GameCategory = 'Semua' | 'Quiz' | 'Party' | 'Racing' | 'Arcade' | 'Word' | 'Puzzle' | 'Battle';

export type RoomStatus = 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'IN_GAME' | 'RESULT' | 'CLOSED';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface Player {
  id: string;
  roomId: string;
  nickname: string;
  avatar: string;
  playerNumber: number;
  playerColor: string;
  score: number;
  partyPoints: number;
  ready?: boolean;
  isReady?: boolean;
  connected: boolean;
  isHost?: boolean;
  joinedAt: number;
  lastSeen: number;
}

export interface Room {
  id: string;
  roomCode: string;
  code?: string;
  hostPlayerId: string;
  status: RoomStatus;
  currentGameId: string | null;
  maxPlayers: number;
  players: Player[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface GameDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number | string; // in seconds or display format (e.g. '60s')
  icon: string; // Lucide icon name or emoji
  tagline: string;
  enabled: boolean;
}

export interface ControllerInputEvent {
  roomId: string;
  playerId: string;
  gameId: string;
  action: string;
  payload?: any;
  timestamp: number;
}

export interface RealtimeMessage {
  type: 
    | 'PLAYER_JOIN'
    | 'PLAYER_LEAVE'
    | 'PLAYER_READY'
    | 'HOST_CHANGE'
    | 'ROOM_UPDATE'
    | 'SELECT_GAME'
    | 'START_COUNTDOWN'
    | 'START_GAME'
    | 'GAME_STATE'
    | 'CONTROLLER_INPUT'
    | 'ROUND_END'
    | 'GAME_END'
    | 'PARTY_POINTS_UPDATE'
    | 'REMATCH'
    | 'RETURN_LOBBY'
    | 'PING'
    | 'PONG';
  roomId: string;
  senderId: string;
  payload: any;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  avatar: string;
  totalPoints: number;
  wins: number;
  gamesPlayed: number;
  updatedAt: string;
}

export interface PlayerProfile {
  nickname: string;
  avatar: string;
  favoriteGame: string;
  wins: number;
  gamesPlayed: number;
  partyPoints: number;
}

export interface AudioSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 100
  vibrationEnabled: boolean;
}

export const PLAYER_COLORS = [
  '#38bdf8', // Cyan (P1)
  '#f43f5e', // Rose (P2)
  '#10b981', // Emerald (P3)
  '#fbbf24', // Amber (P4)
  '#a855f7', // Purple (P5)
  '#ec4899', // Pink (P6)
  '#06b6d4', // Sky (P7)
  '#f97316', // Orange (P8)
];

export const AVATAR_OPTIONS = [
  '😀', '😎', '🤖', '🐱', '🐸', '🦊', '👾', '🐼',
  '🦁', '🐯', '🦄', '🚀', '🔥', '⚡', '👑', '🎮'
];
