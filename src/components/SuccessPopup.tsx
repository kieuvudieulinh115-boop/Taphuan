import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../services/AudioManager';
import { Sparkles, Timer } from 'lucide-react';

interface SuccessPopupProps {
  currentPiecesCount: number;
  totalPiecesCount: number;
  onContinue: () => void;
  autoCloseSeconds?: number;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({
  currentPiecesCount,
  totalPiecesCount,
  onContinue,
  autoCloseSeconds = 3
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(autoCloseSeconds);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;
  const hasTriggeredRef = useRef(false);

  const isCompleted = currentPiecesCount >= totalPiecesCount;

  useEffect(() => {
    setSecondsLeft(autoCloseSeconds);
    hasTriggeredRef.current = false;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            onContinueRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCloseSeconds]);

  const handleManualContinue = () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    audioManager.playClick();
    onContinueRef.current();
  };

  const percentRemaining = (secondsLeft / autoCloseSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xs rounded-2xl bg-slate-900 border-2 border-amber-400 p-4 text-center shadow-[0_15px_40px_rgba(0,0,0,0.85)] relative z-10">
        <div className="text-4xl mb-1">
          {isCompleted ? '🏆' : '🎉'}
        </div>

        <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wide mb-0.5">
          {isCompleted ? 'HOÀN THÀNH BỨC TRANH!' : 'ĐÃ GHÉP THÀNH CÔNG'}
        </h3>
        <p className="text-[11px] font-bold text-cyan-300 mb-3">
          {isCompleted ? 'MỞ KHÓA TOÀN BỘ TRANH BÍ ẨN' : 'MẢNH GHÉP ĐÃ VÀO VỊ TRÍ'}
        </p>

        <div className="inline-block px-5 py-1.5 rounded-xl bg-slate-800 border border-cyan-500/40 text-amber-400 font-black text-xl font-mono mb-3">
          {currentPiecesCount} / {totalPiecesCount} MẢNH
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-cyan-500/30 mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all ease-linear"
            style={{
              width: `${Math.max(0, percentRemaining)}%`,
              transitionDuration: '950ms'
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-cyan-200 mb-3">
          <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span>
            Tự động chuyển tiếp sau <strong className="text-amber-300 font-mono">{secondsLeft}s</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleManualContinue}
          className="w-full h-11 rounded-xl font-black text-sm text-slate-950 uppercase tracking-wide bg-gradient-to-r from-amber-400 to-yellow-300 active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-md border border-yellow-200 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>TIẾP TỤC NGAY ({secondsLeft}s)</span>
        </button>
      </div>
    </div>
  );
};
