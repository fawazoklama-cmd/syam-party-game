import React, { useState, useEffect, useCallback } from 'react';
import { Room, Player, ControllerInputEvent } from './types';
import { roomManager } from './lib/roomManager';
import { sound } from './lib/sound';
import { Header } from './components/Header';
import { QRGeneratorModal } from './components/QRGeneratorModal';
import { HomePage } from './pages/HomePage';
import { TVModePage } from './pages/TVModePage';
import { ControllerPage } from './pages/ControllerPage';
import { GameLibraryPage } from './pages/GameLibraryPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { GameHub } from './games/GameHub';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [urlParamCode, setUrlParamCode] = useState<string>('');
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [inputEvents, setInputEvents] = useState<ControllerInputEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Hash-based router listener & URL param parser
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      const [path, query] = hash.split('?');
      setCurrentRoute(path || 'home');

      if (query) {
        const params = new URLSearchParams(query);
        const codeParam = params.get('code');
        if (codeParam) {
          setUrlParamCode(codeParam.toUpperCase());
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string, params?: { code?: string }) => {
    let url = `#${route}`;
    if (params?.code) {
      url += `?code=${params.code}`;
    }
    window.location.hash = url;
  };

  // Subscribe to RoomManager
  useEffect(() => {
    const unsubRoom = roomManager.onRoomUpdated((updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom) {
        setPlayers(updatedRoom.players);
      }
    });

    const unsubInput = roomManager.onInputReceived((event) => {
      setInputEvents((prev) => [...prev.slice(-20), event]);
    });

    // Check if there was an existing session restored
    const existing = roomManager.getRoom();
    if (existing) {
      setRoom(existing);
      setPlayers(existing.players);
      const myId = roomManager.getCurrentPlayerId();
      if (myId) {
        const me = existing.players.find((p) => p.id === myId) || null;
        setCurrentPlayer(me);
      }
    }

    return () => {
      unsubRoom();
      unsubInput();
    };
  }, []);

  // Audio mute toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  // --- ACTIONS ---

  // 1. Play TV -> Create or Join as TV Host
  const handleSelectPlayTV = async () => {
    sound.init();
    try {
      const newRoom = await roomManager.createRoom('SyamTV Host', '📺');
      setRoom(newRoom);
      setPlayers(newRoom.players);
      navigate('tv');
    } catch (err) {
      console.error('Failed to create TV room:', err);
    }
  };

  // 2. Play Controller -> Navigate to Controller page
  const handleSelectPlayController = () => {
    sound.init();
    navigate('controller');
  };

  // 3. Controller Join Room
  const handleJoinRoom = async (
    code: string,
    nickname: string,
    avatar: string
  ): Promise<{ success: boolean; error?: string }> => {
    sound.init();
    try {
      const res = await roomManager.joinRoom(code, nickname, avatar);
      if (res.success && res.room) {
        setRoom(res.room);
        setPlayers(res.room.players);
        const myId = roomManager.getCurrentPlayerId();
        const me = res.room.players.find((p) => p.id === myId) || res.player || null;
        setCurrentPlayer(me);
        return { success: true };
      }
      return { success: false, error: res.error || 'Gagal bergabung. Pastikan kode room benar.' };
    } catch (err: any) {
      console.error('Join error:', err);
      return { success: false, error: 'Terjadi kesalahan koneksi.' };
    }
  };

  // 4. Start Game (from TV Lobby)
  const handleStartGame = async (gameId: string) => {
    sound.init();
    await roomManager.startGame(gameId);
  };

  // 5. Send Controller Input
  const handleSendInput = (action: string, payload?: any) => {
    roomManager.sendInput(action, payload);
  };

  // 6. Toggle Ready (Controller)
  const handleToggleReady = () => {
    if (currentPlayer) {
      roomManager.setPlayerReady(!currentPlayer.isReady);
      setCurrentPlayer((prev) => (prev ? { ...prev, isReady: !prev.isReady } : null));
    }
  };

  // 7. Kick Player (Host)
  const handleKickPlayer = (playerId: string) => {
    roomManager.kickPlayer(playerId);
  };

  // 8. Leave Room
  const handleLeaveRoom = () => {
    roomManager.leaveRoom();
    setRoom(null);
    setCurrentPlayer(null);
    setInputEvents([]);
    navigate('home');
  };

  // 9. Game Ended (Rankings Award)
  const handleFinishGame = async (rankings: { playerId: string; rank: number; score: number }[]) => {
    const pointBonuses: { [rank: number]: number } = { 1: 100, 2: 75, 3: 50, 4: 25 };
    rankings.forEach((r) => {
      const bonus = pointBonuses[r.rank] || 10;
      roomManager.updatePlayerScore(r.playerId, bonus);
    });
  };

  // 10. Rematch
  const handleRematch = async () => {
    if (room?.currentGameId) {
      await roomManager.startGame(room.currentGameId);
    }
  };

  // 11. Change Game (Back to TV Lobby)
  const handleChangeGame = async () => {
    await roomManager.setGameStatus('LOBBY');
  };

  // --- RENDER CURRENT VIEW ---
  const renderContent = () => {
    // If in TV Mode and a game is actively running (IN_GAME)
    if (currentRoute === 'tv' && room && room.status === 'IN_GAME' && room.currentGameId) {
      return (
        <GameHub
          room={room}
          players={players}
          inputEvents={inputEvents}
          onFinishGame={handleFinishGame}
          onRematch={handleRematch}
          onChangeGame={handleChangeGame}
        />
      );
    }

    switch (currentRoute) {
      case 'tv':
        if (!room) {
          // Recreate or go home
          return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] text-center p-6">
              <p className="text-slate-400 mb-4">Tidak ada room TV aktif.</p>
              <button
                onClick={handleSelectPlayTV}
                className="px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-black"
              >
                Buat Room TV Baru
              </button>
            </div>
          );
        }
        return (
          <TVModePage
            room={room}
            players={players}
            onStartGame={handleStartGame}
            onKickPlayer={handleKickPlayer}
            onLeaveRoom={handleLeaveRoom}
            onOpenQRGenerator={() => setIsQRModalOpen(true)}
          />
        );

      case 'controller':
        return (
          <ControllerPage
            initialCode={urlParamCode}
            room={room}
            currentPlayer={currentPlayer}
            onJoinRoom={handleJoinRoom}
            onSendInput={handleSendInput}
            onLeaveRoom={handleLeaveRoom}
            onToggleReady={handleToggleReady}
          />
        );

      case 'library':
        return (
          <GameLibraryPage
            onBack={() => navigate('home')}
            onSelectGameToPlay={async (gameId) => {
              if (room) {
                await roomManager.startGame(gameId);
                navigate('tv');
              } else {
                const newRoom = await roomManager.createRoom('SyamTV Host', '📺');
                setRoom(newRoom);
                await roomManager.startGame(gameId);
                navigate('tv');
              }
            }}
          />
        );

      case 'leaderboard':
        return <LeaderboardPage onBack={() => navigate('home')} />;

      case 'settings':
        return (
          <SettingsPage
            onBack={() => navigate('home')}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />
        );

      case 'home':
      default:
        return (
          <HomePage
            onSelectPlayTV={handleSelectPlayTV}
            onSelectPlayController={handleSelectPlayController}
            onOpenLibrary={() => navigate('library')}
            onOpenLeaderboard={() => navigate('leaderboard')}
            onOpenSettings={() => navigate('settings')}
            onQuickRandomGame={async () => {
              const newRoom = await roomManager.createRoom('SyamTV Host', '📺');
              setRoom(newRoom);
              navigate('tv');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header bar (hidden during intensive controller gameplay to maximize screen) */}
      {!(currentRoute === 'controller' && room?.status === 'IN_GAME') && (
        <Header
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onOpenSettings={() => navigate('settings')}
          onOpenQRGenerator={() => setIsQRModalOpen(true)}
          onGoHome={() => navigate('home')}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">{renderContent()}</main>

      {/* Global QR Code Generator Modal */}
      <QRGeneratorModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        defaultRoomCode={room?.code || ''}
      />
    </div>
  );
}

