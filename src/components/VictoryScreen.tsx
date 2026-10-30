import React, { useRef, useEffect } from 'react';
import { RotateCcw, Home, Award, Sparkles } from 'lucide-react';
import { audioManager } from '../services/AudioManager';

interface VictoryScreenProps {
  playerName: string;
  playerSchool?: string;
  imageUrl: string;
  schoolLogoUrl?: string;
  totalScore?: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  playerName = 'Học sinh',
  playerSchool,
  imageUrl,
  totalScore = 450,
  onPlayAgain,
  onGoHome
}) => {
  const canvasConfettiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    audioManager.playVictoryFanfare();

    const canvas = canvasConfettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiPieces: {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotSpeed: number;
    }[] = [];

    const colors = ['#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#8b5cf6', '#eab308'];

    for (let i = 0; i < 90; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 3,
        speedY: Math.random() * 2.5 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 5
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiPieces.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height) {
          p.y = -15;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden p-3 sm:p-4 bg-slate-950 text-slate-100 select-none max-w-md md:max-w-lg mx-auto">
      {/* Falling Confetti Canvas */}
      <canvas ref={canvasConfettiRef} className="fixed inset-0 pointer-events-none z-10" />

      {/* 1. Header (Top) */}
      <header className="relative z-20 shrink-0 text-center pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1 animate-bounce">
          <Award className="w-4 h-4" /> CHIẾN THẮNG TUYỆT ĐỐI!
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
          Chúc mừng {playerName || 'Nhà thám hiểm STEM'}!
        </h1>
        {playerSchool && (
          <p className="text-[11px] font-semibold text-cyan-300/90 mt-0.5">
            {playerSchool}
          </p>
        )}
      </header>

      {/* 2. Main Content (Center) */}
      <main className="relative z-20 flex-1 min-h-0 flex flex-col items-center justify-center py-2 overflow-hidden">
        {/* Mystery Picture Fully Revealed Frame */}
        <div className="w-full max-w-[340px] max-h-[36vh] aspect-[4/3] rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] bg-slate-900 shrink-0 mb-2.5">
          <img
            src={imageUrl}
            alt="Bức tranh bí ẩn hoàn thiện"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Score & Praise Pill */}
        <div className="flex flex-col items-center gap-1 text-center shrink-0">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/60 text-amber-300 font-black text-sm sm:text-base font-mono shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>TỔNG ĐIỂM: {totalScore} ĐIỂM (9/9 Vòng)</span>
          </div>
          <p className="text-[11px] sm:text-xs text-cyan-200 font-medium max-w-xs mt-1">
            Bạn đã xuất sắc hoàn thành trọn vẹn 9 thử thách khuôn mặt và ghép thành công bức tranh bí ẩn!
          </p>
        </div>
      </main>

      {/* 3. Action Buttons (Bottom) */}
      <footer className="relative z-20 shrink-0 flex flex-col gap-2 pb-2">
        <button
          type="button"
          onClick={() => {
            audioManager.playClick();
            onPlayAgain();
          }}
          className="w-full h-12 rounded-2xl font-black text-base text-slate-950 uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_4px_0_#C67100,0_8px_18px_rgba(255,179,0,0.5)] border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>CHƠI LẠI VÁN MỚI</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioManager.playClick();
            onGoHome();
          }}
          className="w-full h-11 rounded-2xl font-bold text-xs sm:text-sm text-cyan-200 bg-slate-900 border border-cyan-500/40 hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition"
        >
          <Home className="w-4 h-4 text-cyan-400" />
          <span>VỀ TRANG CHỦ</span>
        </button>
      </footer>
    </div>
  );
};
