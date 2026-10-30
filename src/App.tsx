import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GameSettings, QuestionSet, ActiveGameConfig } from './types';
import { indexedDBService } from './services/IndexedDBService';
import { audioManager } from './services/AudioManager';
import { StartScreen } from './components/StartScreen';
import { ChallengeView } from './components/ChallengeView';
import { QuestionModal } from './components/QuestionModal';
import { PuzzleBoard } from './components/PuzzleBoard';
import { VictoryScreen } from './components/VictoryScreen';
import { FIXED_GAME_ROUNDS, TOTAL_GAME_ROUNDS, MAX_TOTAL_SCORE } from './data/fixedRounds';
import { DEFAULT_QUESTION_SETS } from './data/defaultQuestions';
import { generatePuzzleSessionPieces, computeImageContentHash } from './services/PuzzleService';

export default function App() {
  // Settings & Fixed Game Configuration
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [activeGameConfig, setActiveGameConfig] = useState<ActiveGameConfig | null>(null);
  const isInitializingSessionRef = useRef(false);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);

  // Player & Game Flow State
  const [playerName, setPlayerName] = useState('');
  const [playerSchool, setPlayerSchool] = useState('');
  const [gamePhase, setGamePhase] = useState<'start' | 'challenge' | 'puzzle' | 'victory'>('start');

  // Unified Fixed Progress State
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0); // 0 to 8 (Rounds 1 to 9)
  const [playerScore, setPlayerScore] = useState(0); // 50 pts per challenge (max 450)
  const [placedPieceIds, setPlacedPieceIds] = useState<number[]>([]);
  const [placementCredits, setPlacementCredits] = useState(0);
  const [challengeTurnNonce, setChallengeTurnNonce] = useState(0);

  // Modal overlays
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Current fixed round data
  const currentRound = FIXED_GAME_ROUNDS[currentRoundIndex] || FIXED_GAME_ROUNDS[0];

  // Fixed Questions Set: 9 questions for the 9 rounds
  const fixedQuestions = useMemo(() => {
    return DEFAULT_QUESTION_SETS[0]?.questions || [];
  }, []);

  const currentQuestion = useMemo(() => {
    return fixedQuestions[currentRound.questionIndex] || fixedQuestions[0];
  }, [fixedQuestions, currentRound]);

  // Centralized session creator: builds snapshot and slices puzzle pieces
  const startNewGameSession = useCallback(
    async (targetSettings: GameSettings) => {
      if (isInitializingSessionRef.current) return;
      isInitializingSessionRef.current = true;

      try {
        const sessionId = `session_${Date.now()}`;
        const imageVersion = computeImageContentHash(targetSettings.puzzleImageUrl);

        // 1. Tải và cắt 9 mảnh ghép trực tiếp từ ảnh nguồn
        const pieces = await generatePuzzleSessionPieces(
          targetSettings.puzzleImageUrl,
          sessionId,
          imageVersion
        );

        // 2. Bộ câu hỏi cố định STEM Tiểu học
        const qSet = DEFAULT_QUESTION_SETS[0];

        // 3. Snapshot cấu hình cố định
        const snapshot: ActiveGameConfig = {
          gameSessionId: sessionId,
          imageVersion,
          puzzleSourceImage: targetSettings.puzzleImageUrl,
          puzzleImageNaturalWidth: targetSettings.puzzleImageNaturalWidth,
          puzzleImageNaturalHeight: targetSettings.puzzleImageNaturalHeight,
          puzzlePieces: pieces,
          questionSet: qSet,
          requiredScores: { ...targetSettings.requiredScores },
          enabledChallenges: { ...targetSettings.enabledChallenges },
          countdownDuration: targetSettings.countdownDuration,
          schoolName: targetSettings.schoolName,
          teacherName: targetSettings.teacherName,
          schoolLogoUrl: targetSettings.schoolLogoUrl,
          createdAt: Date.now()
        };

        setActiveGameConfig(snapshot);
        setSettings(targetSettings);

        // Reset game state
        setCurrentRoundIndex(0);
        setPlayerScore(0);
        setPlacedPieceIds([]);
        setPlacementCredits(0);
        setChallengeTurnNonce((n) => n + 1);
        setShowQuestionModal(false);
      } catch (err) {
        console.error('[GameSession] Lỗi khởi tạo ván mới:', err);
      } finally {
        isInitializingSessionRef.current = false;
      }
    },
    []
  );

  // Load initial settings
  useEffect(() => {
    async function loadData() {
      const s = await indexedDBService.getSettings();
      setSettings(s);
      await startNewGameSession(s);
    }
    loadData();
  }, [startNewGameSession]);

  // Audio Toggle
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioManager.setMuted(nextMute);
  };

  // Start Game from Home
  const handleStartGame = () => {
    audioManager.init();
    audioManager.startBGM();

    setCurrentRoundIndex(0);
    setPlayerScore(0);
    setPlacedPieceIds([]);
    setPlacementCredits(0);
    setChallengeTurnNonce((n) => n + 1);
    setShowQuestionModal(false);

    setGamePhase('challenge');
  };

  // Full Match Reset (Làm lại ván mới từ đầu)
  const handleResetGame = () => {
    audioManager.init();
    setCurrentRoundIndex(0);
    setPlayerScore(0);
    setPlacedPieceIds([]);
    setPlacementCredits(0);
    setChallengeTurnNonce((n) => n + 1);
    setShowQuestionModal(false);

    setGamePhase('challenge');
  };

  // 1. Challenge Succeeded -> Award challenge score reward and show question
  const handleChallengeSuccess = () => {
    const reward = currentRound?.scoreReward || 50;
    setPlayerScore((prev) => prev + reward);
    setShowQuestionModal(true);
  };

  // 2. Question Answered Correctly -> Unlock piece and move to puzzle board
  const handleQuestionCorrect = () => {
    setShowQuestionModal(false);
    setPlacementCredits(1); // 1 piece credit to place
    setGamePhase('puzzle');
  };

  // 3. Question Answered Wrong -> Return to current challenge to retry
  const handleQuestionWrong = () => {
    setShowQuestionModal(false);
    setChallengeTurnNonce((n) => n + 1);
    setGamePhase('challenge');
  };

  // 4. Piece Placed Successfully into Puzzle Board
  const handlePlacePieceSuccess = (pieceId: number) => {
    if (!placedPieceIds.includes(pieceId)) {
      setPlacedPieceIds((prev) => [...prev, pieceId]);
    }
    setPlacementCredits(0);
  };

  // 5. Continue to Next Round (or Victory if all 9 pieces placed)
  const handleReturnToChallenge = () => {
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex >= TOTAL_GAME_ROUNDS || placedPieceIds.length >= TOTAL_GAME_ROUNDS) {
      setGamePhase('victory');
    } else {
      setCurrentRoundIndex(nextIndex);
      setChallengeTurnNonce((n) => n + 1);
      setGamePhase('challenge');
    }
  };

  if (!settings) {
    return (
      <div className="w-full h-[100dvh] bg-slate-950 flex items-center justify-center text-cyan-400 font-bold">
        Đang khởi tạo trò chơi STEM...
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. Màn hình mở đầu (Start Screen) */}
      {gamePhase === 'start' && (
        <StartScreen
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          playerSchool={playerSchool}
          onPlayerSchoolChange={setPlayerSchool}
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          schoolLogoUrl={activeGameConfig?.schoolLogoUrl || settings.schoolLogoUrl}
        />
      )}

      {/* 2. Màn hình thử thách khuôn mặt (Challenge View) */}
      {gamePhase === 'challenge' && (
        <ChallengeView
          key={`challenge-round-${currentRoundIndex}-${challengeTurnNonce}`}
          roundNumber={currentRound.roundNumber}
          totalRounds={TOTAL_GAME_ROUNDS}
          totalScore={playerScore}
          challengeType={currentRound.challengeType}
          challengeTurnNonce={challengeTurnNonce}
          requiredScore={currentRound.requiredScore}
          countdownDuration={activeGameConfig?.countdownDuration || 3}
          onChallengeSuccess={handleChallengeSuccess}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          playerName={playerName}
          playerSchool={playerSchool}
          onResetGame={handleResetGame}
        />
      )}

      {/* 3. Màn hình bàn ghép tranh (Puzzle Board) */}
      {gamePhase === 'puzzle' && (
        <PuzzleBoard
          key={`puzzle-board-${activeGameConfig?.gameSessionId || 'default'}-${currentRoundIndex}`}
          imageUrl={activeGameConfig?.puzzleSourceImage || settings.puzzleImageUrl}
          imageNaturalWidth={activeGameConfig?.puzzleImageNaturalWidth || settings.puzzleImageNaturalWidth}
          imageNaturalHeight={activeGameConfig?.puzzleImageNaturalHeight || settings.puzzleImageNaturalHeight}
          pieces={activeGameConfig?.puzzlePieces}
          gameSessionId={activeGameConfig?.gameSessionId}
          imageVersion={activeGameConfig?.imageVersion}
          placedPieceIds={placedPieceIds}
          placementCredits={placementCredits}
          currentPieceToPlace={currentRound.pieceId}
          totalScore={playerScore}
          onPlacePieceSuccess={handlePlacePieceSuccess}
          onReturnToChallenge={handleReturnToChallenge}
          onResetGame={handleResetGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          playerName={playerName}
        />
      )}

      {/* 4. Màn hình chiến thắng (Victory Screen) */}
      {gamePhase === 'victory' && (
        <VictoryScreen
          playerName={playerName}
          playerSchool={playerSchool}
          imageUrl={activeGameConfig?.puzzleSourceImage || settings.puzzleImageUrl}
          schoolLogoUrl={activeGameConfig?.schoolLogoUrl || settings.schoolLogoUrl}
          totalScore={playerScore}
          onPlayAgain={handleResetGame}
          onGoHome={() => setGamePhase('start')}
        />
      )}

      {/* 5. Question Modal Overlay */}
      {showQuestionModal && (
        <QuestionModal
          question={currentQuestion}
          roundNumber={currentRound.roundNumber}
          totalRounds={TOTAL_GAME_ROUNDS}
          totalScore={playerScore}
          onAnswerCorrect={handleQuestionCorrect}
          onAnswerWrong={handleQuestionWrong}
        />
      )}
    </div>
  );
}
