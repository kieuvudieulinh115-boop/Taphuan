import React, { useState } from 'react';
import { Volume2, VolumeX, User, School, Zap } from 'lucide-react';
import { audioManager } from '../services/AudioManager';
import { Background3D } from './Background3D';
import { FptSchoolsLogo } from './FptSchoolsLogo';
import { StemRobotMascot } from './StemRobotMascot';

interface StartScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  playerSchool: string;
  onPlayerSchoolChange: (school: string) => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  schoolLogoUrl?: string;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  playerName,
  onPlayerNameChange,
  playerSchool,
  onPlayerSchoolChange,
  onStartGame,
  isMuted,
  onToggleMute
}) => {
  const [errorMsg, setErrorMsg] = useState('');

  const handleStart = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      audioManager.playClick();
    } catch {}

    const trimmed = playerName.trim();
    if (!trimmed) {
      onPlayerNameChange('Thí sinh STEM');
    }
    setErrorMsg('');
    onStartGame();
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden select-none text-slate-100 bg-slate-950 max-w-md md:max-w-lg mx-auto">
      {/* Background visual effects */}
      <Background3D />

      {/* 1. Header (Top) - Seamless transparent header, keeping FPT Schools logo & sound button */}
      <header className="relative z-30 shrink-0 pt-3 pb-1 px-4 flex items-center justify-between bg-transparent border-none">
        <FptSchoolsLogo size="sm" />

        <button
          onClick={() => {
            audioManager.playClick();
            onToggleMute();
          }}
          className="w-10 h-10 rounded-full bg-blue-950/60 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/20 active:scale-95 flex items-center justify-center transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] backdrop-blur-xs"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </header>

      {/* 2. Main Stage (Middle, Centered & Contained in 1 Viewport) */}
      <main className="relative z-20 flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-2 w-full overflow-hidden">
        {/* Robot Mascot & Title Lockup */}
        <div className="flex flex-col items-center text-center mb-2 shrink-0">
          <div className="relative mb-1">
            <StemRobotMascot size="sm" mood="happy" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300 tracking-wide uppercase leading-tight drop-shadow-[0_2px_12px_rgba(6,182,212,0.5)]">
            THỬ THÁCH KHUÔN MẶT
          </h1>
          <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wider uppercase mt-0.5">
            GHÉP TRANH BÍ ẨN STEM
          </p>
        </div>

        {/* Input Card Container */}
        <form
          onSubmit={handleStart}
          className="w-full rounded-2xl bg-slate-900/90 backdrop-blur-md border-2 border-cyan-400/70 p-3.5 sm:p-4 shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0"
        >
          <div className="space-y-2.5">
            {/* Field 1: Họ và tên */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1 text-left">
                Họ và tên học sinh <span className="text-amber-400">*</span>
              </label>
              <div className="relative flex items-center bg-slate-950 rounded-xl border border-cyan-500/40 px-3 h-11 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400">
                <User className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => onPlayerNameChange(e.target.value)}
                  placeholder="Nhập tên học sinh (VD: Minh Khang)"
                  className="w-full bg-transparent text-white font-semibold text-xs sm:text-sm outline-none placeholder:text-slate-500"
                  maxLength={30}
                />
              </div>
            </div>

            {/* Field 2: Trường / Lớp */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1 text-left">
                Trường học / Lớp
              </label>
              <div className="relative flex items-center bg-slate-950 rounded-xl border border-cyan-500/40 px-3 h-11 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400">
                <School className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={playerSchool}
                  onChange={(e) => onPlayerSchoolChange(e.target.value)}
                  placeholder="Nhập tên trường / lớp (VD: Lớp 4A - FPT Schools)"
                  className="w-full bg-transparent text-white font-semibold text-xs sm:text-sm outline-none placeholder:text-slate-500"
                  maxLength={40}
                />
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* 3. Bottom CTA Button (Height 52px, large touch target) */}
      <footer className="relative z-30 shrink-0 w-full px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={handleStart}
          className="w-full h-13 rounded-2xl font-black text-base sm:text-lg text-[#0b172a] uppercase tracking-wider bg-gradient-to-b from-[#FFE57F] via-[#FFC107] to-[#FF8F00] active:scale-[0.98] transition shadow-[0_4px_0_#C67100,0_8px_18px_rgba(255,179,0,0.5)] border-2 border-[#FFE082] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-[#0b172a] text-[#0b172a]" />
          <span>BẮT ĐẦU KHÁM PHÁ 🚀</span>
        </button>
      </footer>
    </div>
  );
};
