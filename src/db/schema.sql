-- ===================================================
-- SYAM PARTY GAME — SUPABASE POSTGRESQL SCHEMA
-- Multiplayer Party Game Platform
-- ===================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT NOT NULL UNIQUE,
    host_player_id UUID,
    status TEXT NOT NULL DEFAULT 'LOBBY', -- 'LOBBY', 'PLAYING', 'RESULT', 'CLOSED'
    current_game_id TEXT,
    max_players INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '4 hours')
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- 3. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    nickname VARCHAR(32) NOT NULL,
    avatar TEXT NOT NULL DEFAULT '😀',
    player_number INTEGER NOT NULL DEFAULT 1,
    player_color VARCHAR(16) NOT NULL DEFAULT '#38bdf8',
    score INTEGER DEFAULT 0,
    party_points INTEGER DEFAULT 0,
    ready BOOLEAN DEFAULT false,
    connected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);

-- 4. GAMES REGISTRY TABLE
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 8,
    duration INTEGER NOT NULL DEFAULT 180,
    enabled BOOLEAN DEFAULT true
);

-- 5. GAME SESSIONS TABLE
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    state JSONB DEFAULT '{}'::jsonb,
    round INTEGER DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sessions_room_id ON game_sessions(room_id);

-- 6. SCORES TABLE
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_player_id ON scores(player_id);

-- 7. LEADERBOARD TABLE
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '😀',
    total_points INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public read/write for party gameplay
CREATE POLICY "Public full access on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read on games" ON games FOR SELECT USING (true);
CREATE POLICY "Public full access on game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on leaderboard" ON leaderboard FOR ALL USING (true) WITH CHECK (true);
