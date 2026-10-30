import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Check, Award, Hand, HelpCircle, Eye } from 'lucide-react';
import { PUZZLE_PIECES_CONFIG, generateJigsawPath } from '../services/PuzzleService';
import { audioManager } from '../services/AudioManager';
import { ResetConfirmModal } from './ResetConfirmModal';
import { ActiveGamePiece } from '../types';
import { firePiecePlacedConfetti, fireGrandVictoryConfetti } from '../services/ConfettiService';

interface PuzzleBoardProps {
  imageUrl: string;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  placedPieceIds: number[];
  placementCredits: number;
  currentPieceToPlace?: number; // The piece unlocked in this round (0 to 8)
  pieces?: ActiveGamePiece[];
  gameSessionId?: string;
  imageVersion?: string;
  totalScore?: number;
  onPlacePieceSuccess: (pieceId: number) => void;
  onReturnToChallenge: () => void;
  onResetGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playerName?: string;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  imageUrl,
  imageNaturalWidth = 1200,
  imageNaturalHeight = 800,
  placedPieceIds = [],
  currentPieceToPlace = 0,
  pieces,
  imageVersion,
  totalScore = 0,
  onPlacePieceSuccess,
  onReturnToChallenge,
  onResetGame,
  isMuted,
  onToggleMute
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [justPlacedId, setJustPlacedId] = useState<number | null>(null);
  const [wrongSlotId, setWrongSlotId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Check if current piece has been placed
  const isCurrentPiecePlaced = placedPieceIds.includes(currentPieceToPlace);

  // Default selected piece is currentPieceToPlace if not yet placed
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(
    !isCurrentPiecePlaced ? currentPieceToPlace : null
  );

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardDimensions, setBoardDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 220
  });

  const imageToken = useMemo(() => {
    return imageVersion || 'fixed_puzzle';
  }, [imageVersion]);

  const aspectRatio = (imageNaturalWidth || 1200) / (imageNaturalHeight || 800);

  // Keep selectedPieceId in sync if round piece changes
  useEffect(() => {
    if (!placedPieceIds.includes(currentPieceToPlace)) {
      setSelectedPieceId(currentPieceToPlace);
      setFeedbackMsg(`🧩 Quan sát hình ảnh và viền mép để tìm đúng vị trí trên bảng!`);
    } else {
      setSelectedPieceId(null);
      setFeedbackMsg(`✓ Mảnh ghép đã khớp hoàn hảo vào tranh bí ẩn!`);
    }
  }, [currentPieceToPlace, placedPieceIds]);

  // Adapt board size to available mobile viewport height without overflow
  useEffect(() => {
    const updateSize = () => {
      if (!boardContainerRef.current) return;
      const { clientWidth, clientHeight } = boardContainerRef.current;
      const availW = Math.max(200, clientWidth - 20);
      const availH = Math.max(140, clientHeight - 20);

      let w = availW;
      let h = w / aspectRatio;

      if (h > availH) {
        h = availH;
        w = h * aspectRatio;
      }

      setBoardDimensions({
        width: Math.max(200, Math.floor(w)),
        height: Math.max(140, Math.floor(h))
      });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (boardContainerRef.current) ro.observe(boardContainerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [aspectRatio]);

  const pieceW = boardDimensions.width / 3;
  const pieceH = boardDimensions.height / 3;

  // Manual placement handler: Player taps a slot on the 3x3 board
  const handleSlotClick = (slotId: number) => {
    // If piece already placed on this slot
    if (placedPieceIds.includes(slotId)) {
      audioManager.playHover();
      return;
    }

    // Target piece to place
    const targetPieceId = selectedPieceId !== null ? selectedPieceId : currentPieceToPlace;

    // Check if slot matches targetPieceId
    if (slotId === targetPieceId) {
      // SUCCESS: Manual placement correct!
      audioManager.playPieceSnap();
      firePiecePlacedConfetti();
      if (placedPieceIds.length + 1 >= 9) {
        setTimeout(() => fireGrandVictoryConfetti(), 400);
      }
      setJustPlacedId(targetPieceId);
      setSelectedPieceId(null);
      setWrongSlotId(null);
      setFeedbackMsg(`🎉 Xuất sắc! Bạn đã tìm đúng vị trí của mảnh ghép!`);
      onPlacePieceSuccess(targetPieceId);
    } else {
      // WRONG: Slot does not match!
      audioManager.playWrongAnswer();
      setWrongSlotId(slotId);
      setFeedbackMsg(`❌ Chưa đúng vị trí! Hãy quan sát kỹ chi tiết hình ảnh và viền mép nhé.`);
      setTimeout(() => {
        setWrongSlotId(null);
      }, 550);
    }
  };

  const isCompleted = placedPieceIds.length >= 9;

  // Current piece object for tray preview
  const currentPieceConfig = PUZZLE_PIECES_CONFIG[currentPieceToPlace];
  const currentPieceObj = pieces?.find((p) => p.id === currentPieceToPlace);

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-slate-950 text-slate-100 select-none max-w-md md:max-w-lg mx-auto">
      {/* 1. Header (Top) */}
      <header className="shrink-0 h-13 px-4 flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xs z-20">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 uppercase tracking-wide">
            BÀN GHÉP TRANH BÍ ẨN
          </span>
          <span className="text-[10px] font-bold text-cyan-300 font-mono">
            ĐÃ GHÉP {placedPieceIds.length}/9 MẢNH
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-300 font-black text-xs font-mono">
            <span>⭐ {totalScore}</span>
            <span className="text-[10px] font-normal text-amber-200/80">điểm</span>
          </div>

          <button
            onClick={() => {
              audioManager.playClick();
              onToggleMute();
            }}
            className="w-8 h-8 rounded-full bg-slate-900 border border-cyan-400/50 text-cyan-300 flex items-center justify-center active:scale-95 transition cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              setShowResetConfirm(true);
            }}
            className="w-8 h-8 rounded-full bg-slate-900 border border-red-400/40 text-red-300 flex items-center justify-center active:scale-95 transition cursor-pointer"
            title="Làm lại ván mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Top Guidance Banner */}
      <div className="shrink-0 px-3 py-1 text-center bg-cyan-950/70 border-b border-cyan-500/30">
        <p className="text-[11px] sm:text-xs font-bold text-cyan-200 truncate">
          {feedbackMsg ||
            (!isCurrentPiecePlaced
              ? `Quan sát hình ảnh và viền mép để tìm đúng vị trí trên bảng!`
              : `✓ Đã gắn xong mảnh ghép. Bấm tiếp tục để qua vòng mới!`)}
        </p>
      </div>

      {/* 3. Center: 3x3 Puzzle Board */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-1 w-full overflow-hidden">
        <div
          ref={boardContainerRef}
          className="flex-1 min-h-0 w-full max-w-[390px] relative flex items-center justify-center p-2 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/70 shadow-[0_0_25px_rgba(6,182,212,0.35)]"
        >
          <div
            className="relative rounded-xl overflow-hidden bg-slate-950 shadow-inner border border-cyan-500/40"
            style={{
              width: boardDimensions.width,
              height: boardDimensions.height
            }}
          >
            {isCompleted ? (
              <img
                key={`completed-${imageToken}`}
                src={imageUrl}
                alt="Hoàn thành tranh bí ẩn"
                className="w-full h-full object-contain animate-in fade-in duration-500"
              />
            ) : (
              <svg
                width={boardDimensions.width}
                height={boardDimensions.height}
                viewBox={`0 0 ${boardDimensions.width} ${boardDimensions.height}`}
                className="absolute inset-0 w-full h-full"
              >
                <defs>
                  {PUZZLE_PIECES_CONFIG.map((piece) => {
                    const path = generateJigsawPath(pieceW, pieceH, piece);
                    return (
                      <clipPath
                        key={`clip-${piece.id}-${imageToken}`}
                        id={`piece-clip-${piece.id}-${imageToken}`}
                      >
                        <path d={path} />
                      </clipPath>
                    );
                  })}
                </defs>

                {/* 3x3 Interactive Slots */}
                {PUZZLE_PIECES_CONFIG.map((piece) => {
                  const pieceObj = pieces?.find((p) => p.id === piece.id);
                  const isPlaced = placedPieceIds.includes(piece.id);
                  const isJustPlaced = justPlacedId === piece.id;
                  const isWrong = wrongSlotId === piece.id;
                  const pathData = generateJigsawPath(pieceW, pieceH, piece);
                  const slotX = piece.col * pieceW;
                  const slotY = piece.row * pieceH;
                  const pieceClipId = `piece-clip-${piece.id}-${imageToken}`;

                  return (
                    <g
                      key={`slot-${piece.id}-${imageToken}`}
                      transform={`translate(${slotX}, ${slotY})`}
                      onClick={() => handleSlotClick(piece.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rawId = e.dataTransfer.getData('text/plain');
                        const droppedId = parseInt(rawId, 10);
                        if (!isNaN(droppedId)) {
                          if (droppedId === piece.id) {
                            audioManager.playPieceSnap();
                            firePiecePlacedConfetti();
                            if (placedPieceIds.length + 1 >= 9) {
                              setTimeout(() => fireGrandVictoryConfetti(), 400);
                            }
                            setJustPlacedId(piece.id);
                            setSelectedPieceId(null);
                            onPlacePieceSuccess(piece.id);
                          } else {
                            audioManager.playWrongAnswer();
                            setWrongSlotId(piece.id);
                            setTimeout(() => setWrongSlotId(null), 550);
                          }
                        }
                      }}
                      className={`cursor-pointer ${isWrong ? 'animate-spring-shake' : ''}`}
                    >
                      {/* Slot boundary outline */}
                      <path
                        d={pathData}
                        fill={
                          isWrong
                            ? 'rgba(239, 68, 68, 0.45)'
                            : isPlaced
                            ? 'transparent'
                            : 'rgba(15, 23, 42, 0.75)'
                        }
                        stroke={
                          isWrong
                            ? '#EF4444'
                            : isJustPlaced
                            ? '#F59E0B'
                            : isPlaced
                            ? 'rgba(6, 182, 212, 0.4)'
                            : 'rgba(56, 189, 248, 0.35)'
                        }
                        strokeWidth={isWrong ? 3 : isJustPlaced ? 2.5 : 1}
                        strokeDasharray={isPlaced ? 'none' : '3,2'}
                      />

                      {/* Placed image piece slice */}
                      {isPlaced && (
                        pieceObj?.dataUrl ? (
                          <image
                            href={pieceObj.dataUrl}
                            xlinkHref={pieceObj.dataUrl}
                            x={-pieceW * 0.22}
                            y={-pieceH * 0.22}
                            width={pieceW * 1.44}
                            height={pieceH * 1.44}
                            preserveAspectRatio="none"
                          />
                        ) : (
                          <g clipPath={`url(#${pieceClipId})`}>
                            <image
                              href={imageUrl}
                              xlinkHref={imageUrl}
                              x={-piece.col * pieceW}
                              y={-piece.row * pieceH}
                              width={boardDimensions.width}
                              height={boardDimensions.height}
                              preserveAspectRatio="none"
                            />
                          </g>
                        )
                      )}

                      {/* Subtle empty slot hint (Does not reveal answer) */}
                      {!isPlaced && (
                        <g>
                          <circle
                            cx={pieceW / 2}
                            cy={pieceH / 2}
                            r={3}
                            fill="rgba(56, 189, 248, 0.3)"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </main>

      {/* 4. Khay mảnh ghép cần tự ghép (Interactive Piece Tray for student) */}
      {!isCurrentPiecePlaced && !isCompleted && (
        <section className="shrink-0 mx-3 my-1 p-2 rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border-2 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-between gap-3">
          {/* Piece Thumbnail Card with tactile click & drag */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', currentPieceToPlace.toString());
              setSelectedPieceId(currentPieceToPlace);
            }}
            onClick={() => {
              audioManager.playClick();
              setSelectedPieceId(currentPieceToPlace);
            }}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-slate-950 border-2 p-1 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 ${
              selectedPieceId === currentPieceToPlace
                ? 'border-amber-400 shadow-[0_0_20px_#f59e0b] scale-105 animate-pulse'
                : 'border-cyan-400/80 hover:border-cyan-300'
            }`}
          >
            {/* SVG mini preview of the jigsaw piece */}
            <svg
              viewBox={`-${24 * 0.25} -${24 * 0.25} ${24 * 1.5} ${24 * 1.5}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <clipPath id={`tray-clip-curr-${imageToken}`}>
                  <path d={generateJigsawPath(24, 24, currentPieceConfig)} />
                </clipPath>
              </defs>
              <path
                d={generateJigsawPath(24, 24, currentPieceConfig)}
                fill="#1e293b"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              <g clipPath={`url(#tray-clip-curr-${imageToken})`}>
                <image
                  href={imageUrl}
                  xlinkHref={imageUrl}
                  x={-currentPieceConfig.col * 24}
                  y={-currentPieceConfig.row * 24}
                  width={24 * 3}
                  height={24 * 3}
                  preserveAspectRatio="none"
                />
              </g>
            </svg>
          </div>

          {/* Instructions to observe and place manually */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-black text-amber-300 uppercase">
                MẢNH GHÉP BÍ ẨN
              </span>
              <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                <Eye className="w-3 h-3" /> QUAN SÁT
              </span>
            </div>
            <p className="text-[11px] text-cyan-200 font-medium leading-tight">
              Hãy quan sát hình ảnh và các cạnh viền để tìm đúng vị trí trên bảng 3x3!
            </p>
          </div>

          <div className="shrink-0 pr-1">
            <Hand className="w-6 h-6 text-amber-400 animate-bounce" />
          </div>
        </section>
      )}

      {/* 5. Bottom Action Button */}
      <footer className="shrink-0 w-full max-w-md mx-auto px-4 pb-3 pt-1">
        {isCompleted ? (
          <button
            type="button"
            onClick={() => {
              audioManager.playClick();
              onReturnToChallenge();
            }}
            className="w-full h-12 rounded-2xl font-black text-base text-slate-950 uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_4px_0_#C67100,0_8px_18px_rgba(255,179,0,0.5)] border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition"
          >
            <Award className="w-5 h-5 text-slate-950" />
            <span>XEM KẾT QUẢ & PHẦN THƯỞNG 🏆</span>
          </button>
        ) : isCurrentPiecePlaced ? (
          <button
            type="button"
            onClick={() => {
              audioManager.playClick();
              onReturnToChallenge();
            }}
            className="w-full h-12 rounded-2xl font-black text-base text-slate-950 uppercase tracking-wider bg-gradient-to-b from-[#FFE57F] via-[#FFC107] to-[#FF8F00] shadow-[0_4px_0_#C67100,0_8px_18px_rgba(255,179,0,0.5)] border-2 border-[#FFE082] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition"
          >
            <span>TIẾP TỤC VÒNG {placedPieceIds.length + 1}</span>
            <span className="text-xl">➔</span>
          </button>
        ) : (
          <div className="w-full h-12 rounded-2xl font-bold text-xs sm:text-sm text-cyan-300/80 bg-slate-900 border border-cyan-500/40 flex items-center justify-center gap-2 select-none">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>HÃY TỰ GHÉP MẢNH TRANH VÀO BẢNG ĐỂ TIẾP TỤC</span>
          </div>
        )}
      </footer>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetConfirm}
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetGame();
        }}
        onCancel={() => setShowResetConfirm(false)}
        title="LÀM LẠI VÁN MỚI?"
        description="Bạn có chắc muốn bắt đầu lại ván mới từ đầu? Mảnh ghép và điểm số sẽ được đặt lại."
      />
    </div>
  );
};
