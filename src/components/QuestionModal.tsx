import React, { useState } from 'react';
import {
  Check,
  X,
  Lightbulb,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Question } from '../types';
import { audioManager } from '../services/AudioManager';
import { fireQuestionCorrectConfetti } from '../services/ConfettiService';

interface QuestionModalProps {
  question: Question;
  roundNumber?: number;
  totalRounds?: number;
  totalScore?: number;
  onAnswerCorrect: () => void;
  onAnswerWrong: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  roundNumber = 1,
  totalRounds = 9,
  totalScore = 0,
  onAnswerCorrect,
  onAnswerWrong
}) => {
  const [selectedOpt, setSelectedOpt] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [resultState, setResultState] = useState<'answering' | 'correct' | 'wrong'>('answering');
  const [isSpringShaking, setIsSpringShaking] = useState(false);
  const [showRewardPiece, setShowRewardPiece] = useState(false);

  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    if (resultState !== 'answering') return;
    audioManager.playClick();
    setSelectedOpt(optKey);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOpt || resultState !== 'answering') return;

    audioManager.playClick();
    const isCorrect = selectedOpt === question.correctAnswer;

    if (isCorrect) {
      setResultState('correct');
      setShowRewardPiece(true);
      audioManager.playCorrectAnswer();
      fireQuestionCorrectConfetti();
      setTimeout(() => {
        onAnswerCorrect();
      }, 1400);
    } else {
      setResultState('wrong');
      setIsSpringShaking(true);
      audioManager.playWrongAnswer();
      setTimeout(() => {
        setIsSpringShaking(false);
      }, 600);
      setTimeout(() => {
        onAnswerWrong();
      }, 1100);
    }
  };

  const optionKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl select-none overflow-hidden p-3 sm:p-5 text-slate-100 max-w-md sm:max-w-xl md:max-w-2xl mx-auto h-[100dvh]">
      {/* Celebration floating overlay when correct */}
      {showRewardPiece && (
        <div className="fixed inset-0 z-60 pointer-events-none flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center animate-bounce scale-110">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_40px_#f59e0b] border-2 border-yellow-200">
              <Sparkles className="w-12 h-12 text-slate-950 animate-spin-slow" />
            </div>
            <div className="mt-3 px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-xl shadow-[0_0_25px_#f59e0b] tracking-wider border border-yellow-200">
              +1 MẢNH GHÉP STEM!
            </div>
          </div>
        </div>
      )}

      {/* 1. Header (Top): Progress & Score */}
      <header className="shrink-0 flex items-center justify-between pb-2.5 border-b border-cyan-500/25">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Lightbulb className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
              CÂU HỎI {roundNumber}/{totalRounds}
            </div>
            <div className="text-[11px] sm:text-xs text-cyan-300/80 font-medium">
              Mở khóa mảnh ghép bí ẩn
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-300 font-black text-xs sm:text-sm font-mono shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <span>⭐ {totalScore}</span>
          <span className="text-[10px] sm:text-xs font-normal text-amber-200/80">điểm</span>
        </div>
      </header>

      {/* 2. Middle Content: Expanded Question Box + 4 Larger Options */}
      <main className="flex-1 min-h-0 flex flex-col justify-center py-2 sm:py-3 gap-2.5 sm:gap-3.5 overflow-hidden">
        {/* Question Content Box - Enlarged font & generous padding */}
        <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0a2048] to-[#061430] border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
          <div className="text-xs sm:text-sm font-extrabold text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>NỘI DUNG CÂU HỎI</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug sm:leading-relaxed">
            {question.content}
          </p>
        </div>

        {/* 4 Options Grid/Stack - Substantially larger touch targets, badges and text */}
        <div
          className={`flex-1 min-h-0 flex flex-col justify-around gap-2 sm:gap-2.5 ${
            isSpringShaking ? 'animate-spring-shake' : ''
          }`}
        >
          {optionKeys.map((optKey, idx) => {
            const isSelected = selectedOpt === optKey;
            const isCorrectAnswer = question.correctAnswer === optKey;
            const text = question.options[idx] || '';

            let cardStyle =
              'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-cyan-400/60 shadow-sm';
            let badgeStyle = 'bg-slate-800 text-slate-200 border-slate-600';

            if (resultState === 'answering') {
              if (isSelected) {
                cardStyle =
                  'bg-cyan-950/95 border-cyan-400 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-[1.01]';
                badgeStyle = 'bg-cyan-400 text-slate-950 border-cyan-300 font-black';
              }
            } else if (resultState === 'correct') {
              if (isCorrectAnswer) {
                cardStyle =
                  'bg-emerald-950/95 border-emerald-400 text-emerald-50 shadow-[0_0_25px_#10B981]';
                badgeStyle = 'bg-emerald-400 text-slate-950 border-emerald-300 font-black';
              } else {
                cardStyle = 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-35';
              }
            } else if (resultState === 'wrong') {
              if (isSelected) {
                cardStyle =
                  'bg-rose-950/95 border-rose-500 text-rose-50 shadow-[0_0_25px_#F43F5E]';
                badgeStyle = 'bg-rose-500 text-white border-rose-400 font-black';
              } else if (isCorrectAnswer) {
                cardStyle = 'bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-md';
                badgeStyle = 'bg-emerald-500 text-slate-950 font-black';
              } else {
                cardStyle = 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-35';
              }
            }

            return (
              <button
                key={optKey}
                type="button"
                disabled={resultState !== 'answering'}
                onClick={() => handleSelectOption(optKey)}
                className={`w-full min-h-[52px] sm:min-h-[58px] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2 flex items-center gap-3 sm:gap-3.5 transition-all cursor-pointer text-left active:scale-[0.99] ${cardStyle}`}
              >
                {/* Enlarged A, B, C, D Option Badge */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-xl border-2 flex items-center justify-center font-black text-sm sm:text-base md:text-lg shadow-inner ${badgeStyle}`}
                >
                  {resultState === 'correct' && isCorrectAnswer ? (
                    <Check className="w-5 h-5 stroke-[3.5]" />
                  ) : resultState === 'wrong' && isSelected ? (
                    <X className="w-5 h-5 stroke-[3.5]" />
                  ) : (
                    optKey
                  )}
                </div>

                {/* Enlarged Option Text */}
                <span className="text-sm sm:text-base md:text-lg font-bold flex-1 leading-snug sm:leading-normal">
                  {text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback text */}
        {resultState === 'correct' && (
          <div className="shrink-0 py-1 text-center text-sm sm:text-base font-black text-emerald-300 animate-pulse drop-shadow-[0_0_10px_#10B981]">
            ✓ CHÍNH XÁC! Mảnh ghép bí ẩn đã được mở khóa!
          </div>
        )}
        {resultState === 'wrong' && (
          <div className="shrink-0 py-1 text-center text-sm sm:text-base font-black text-rose-300 drop-shadow-[0_0_10px_#F43F5E]">
            ✕ Chưa chính xác! Hãy thực hiện lại thử thách khuôn mặt nhé.
          </div>
        )}
      </main>

      {/* 3. Bottom Action: Chốt đáp án (Height 52px - 56px, bold and prominent) */}
      <footer className="shrink-0 pt-2 sm:pt-2.5">
        {resultState === 'answering' ? (
          <button
            type="button"
            disabled={!selectedOpt}
            onClick={handleConfirmAnswer}
            className={`w-full h-13 sm:h-14 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedOpt
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_4px_0_#C67100,0_8px_20px_rgba(255,179,0,0.5)] border-2 border-yellow-200 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>CHỐT ĐÁP ÁN</span>
          </button>
        ) : resultState === 'correct' ? (
          <div className="w-full h-13 sm:h-14 rounded-2xl font-black text-sm sm:text-base text-emerald-300 bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>CHÍNH XÁC! ĐANG VÀO BÀN GHÉP TRANH...</span>
          </div>
        ) : (
          <div className="w-full h-13 sm:h-14 rounded-2xl font-black text-sm sm:text-base text-rose-300 bg-rose-950 border-2 border-rose-400 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <X className="w-5 h-5 text-rose-400" />
            <span>ĐANG QUAY LẠI THỬ THÁCH...</span>
          </div>
        )}
      </footer>
    </div>
  );
};
