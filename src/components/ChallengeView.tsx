import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Camera,
  CheckCircle2,
  Zap,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { ChallengeType } from '../types';
import { CHALLENGE_DEFINITIONS } from '../data/challenges';
import { faceLandmarkerService } from '../services/FaceLandmarkerService';
import { ChallengeEvaluator } from '../services/ChallengeEvaluator';
import { audioManager } from '../services/AudioManager';
import { ResetConfirmModal } from './ResetConfirmModal';

interface ChallengeViewProps {
  roundNumber: number; // 1 to 9
  totalRounds: number; // 9
  totalScore: number; // Cumulative game score
  challengeType: ChallengeType;
  challengeTurnNonce?: number;
  requiredScore?: number; // 50
  countdownDuration?: number; // 3
  onChallengeSuccess: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  playerName?: string;
  playerSchool?: string;
  onResetGame?: () => void;
}

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  roundNumber,
  totalRounds = 9,
  totalScore = 0,
  challengeType,
  challengeTurnNonce = 0,
  requiredScore = 50,
  countdownDuration = 3,
  onChallengeSuccess,
  isMuted,
  onToggleMute,
  playerName = 'Học sinh',
  onResetGame
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simCanvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [cameraState, setCameraState] = useState<'requesting' | 'ready' | 'error'>('requesting');
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationText, setValidationText] = useState('Đang kết nối camera...');

  const [phase, setPhase] = useState<'idle' | 'countdown' | 'active' | 'success' | 'failed'>('idle');
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15); // 15 seconds to perform

  // Stream & Animation frame refs
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const simRafIdRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const activeTimerRef = useRef<number | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const hasTriggeredSuccess = useRef<boolean>(false);
  const lastScoreUpdateTimeRef = useRef<number>(0);
  const lastRenderedScoreRef = useRef<number>(0);
  const isMobileRef = useRef<boolean>(isMobileDevice());

  const challengeInfo = CHALLENGE_DEFINITIONS[challengeType] || {
    id: challengeType,
    name: 'CƯỜI MỈM',
    instruction: 'Hãy cười mỉm tươi tắn!',
    defaultScore: 50,
    icon: '😊'
  };

  // Stop camera tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      streamRef.current = null;
    }
  }, []);

  // 1. Initialize Real Camera
  const startCamera = useCallback(async () => {
    setIsSimulatedCamera(false);
    setCameraState('requesting');
    setErrorMessage('');
    setValidationText('Đang kết nối camera...');

    stopTracks();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('error');
      setErrorMessage('Trình duyệt không hỗ trợ truy cập camera trực tiếp. Bạn có thể bật chế độ mô phỏng.');
      return;
    }

    try {
      faceLandmarkerService.initialize().catch((err) => {
        console.warn('FaceLandmarker load fallback:', err);
      });

      const isMobile = isMobileDevice();
      isMobileRef.current = isMobile;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: isMobile ? 480 : 640, max: isMobile ? 640 : 1280 },
            height: { ideal: isMobile ? 360 : 480, max: isMobile ? 480 : 720 },
            frameRate: { ideal: isMobile ? 24 : 30, max: 30 }
          },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
      }

      if (!isComponentMounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (!isComponentMounted.current) return;
          videoRef.current
            ?.play()
            .then(() => {
              if (isComponentMounted.current) {
                setCameraState('ready');
                setValidationText('Khuôn mặt đã sẵn sàng');
              }
            })
            .catch(() => {
              if (isComponentMounted.current) {
                setCameraState('ready');
                setValidationText('Khuôn mặt đã sẵn sàng');
              }
            });
        };
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      if (isComponentMounted.current) {
        setCameraState('error');
        setErrorMessage(
          err?.name === 'NotAllowedError'
            ? 'Quyền truy cập camera bị từ chối. Hãy bấm Cho phép để trải nghiệm.'
            : 'Không thể khởi động camera. Bạn có thể sử dụng chế độ mô phỏng.'
        );
      }
    }
  }, [stopTracks]);

  // Fallback simulation mode
  const enableSimulationMode = useCallback(() => {
    stopTracks();
    setIsSimulatedCamera(true);
    setCameraState('ready');
    setErrorMessage('');
    setValidationText('Đang sử dụng camera mô phỏng');
  }, [stopTracks]);

  // Clean mount/unmount
  useEffect(() => {
    isComponentMounted.current = true;
    startCamera();

    return () => {
      isComponentMounted.current = false;
      stopTracks();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (simRafIdRef.current) cancelAnimationFrame(simRafIdRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    };
  }, [startCamera, stopTracks]);

  // Reset challenge state on new challenge or turn nonce
  useEffect(() => {
    ChallengeEvaluator.reset();
    setCurrentScore(0);
    setPhase('idle');
    setCountdownNum(null);
    setTimeRemaining(15);
    hasTriggeredSuccess.current = false;
    lastRenderedScoreRef.current = 0;
    lastScoreUpdateTimeRef.current = 0;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (activeTimerRef.current) {
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }
  }, [challengeType, challengeTurnNonce]);

  // Handle countdown start
  const handleReadyClick = () => {
    audioManager.playClick();
    ChallengeEvaluator.reset();
    setCurrentScore(0);
    hasTriggeredSuccess.current = false;
    lastRenderedScoreRef.current = 0;
    lastScoreUpdateTimeRef.current = 0;
    setTimeRemaining(15);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (activeTimerRef.current) {
      clearInterval(activeTimerRef.current);
      activeTimerRef.current = null;
    }

    if (cameraState !== 'ready' && !isSimulatedCamera) {
      enableSimulationMode();
    }

    const duration = Math.max(1, countdownDuration || 3);
    setPhase('countdown');
    setCountdownNum(duration);
    audioManager.playCountdownBeep(false);

    let count = duration;
    countdownIntervalRef.current = window.setInterval(() => {
      if (!isComponentMounted.current) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        return;
      }

      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        audioManager.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownNum(0); // "BẮT ĐẦU!"
        audioManager.playCountdownBeep(true);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdownNum(null);
        setPhase('active');

        // Start active round timer (15s)
        let activeTime = 15;
        setTimeRemaining(activeTime);
        activeTimerRef.current = window.setInterval(() => {
          if (!isComponentMounted.current) {
            if (activeTimerRef.current) clearInterval(activeTimerRef.current);
            return;
          }
          activeTime -= 1;
          setTimeRemaining(activeTime);
          if (activeTime <= 0) {
            if (activeTimerRef.current) clearInterval(activeTimerRef.current);
            if (!hasTriggeredSuccess.current) {
              setPhase('failed');
              audioManager.playWrongAnswer();
            }
          }
        }, 1000);
      }
    }, 1000);
  };

  // Real Camera Processing Loop
  useEffect(() => {
    if (cameraState !== 'ready' || isSimulatedCamera) return;

    const isMobile = isMobileRef.current;
    const minInterval = isMobile ? 60 : 35;

    const processFrame = (time: number) => {
      if (!isComponentMounted.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        if (time - lastInferenceTimeRef.current >= minInterval) {
          lastInferenceTimeRef.current = time;

          const data = faceLandmarkerService.detectFace(video, performance.now());
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          if (data && data.landmarks && ctx) {
            const w = canvas.width;
            const h = canvas.height;

            // Draw clean subtle face guide points
            ctx.fillStyle = '#00f0ff';
            const keyIndices = [1, 33, 263, 61, 291, 13, 14, 17, 37, 267, 10, 152];
            keyIndices.forEach((idx) => {
              const pt = data.landmarks[idx];
              if (pt) {
                const lx = (1 - pt.x) * w;
                const ly = pt.y * h;
                ctx.beginPath();
                ctx.arc(lx, ly, 2.5, 0, 2 * Math.PI);
                ctx.fill();
              }
            });

            // Active scoring phase
            if (phase === 'active' && !hasTriggeredSuccess.current) {
              const evalResult = ChallengeEvaluator.evaluate(
                challengeType,
                data.landmarks,
                requiredScore,
                data.blendshapes
              );

              const score = Math.min(requiredScore, Math.round(evalResult.score));

              if (score !== lastRenderedScoreRef.current) {
                lastRenderedScoreRef.current = score;
                setCurrentScore(score);
              }

              // Check if passed 50 points target!
              if (score >= requiredScore && !hasTriggeredSuccess.current) {
                hasTriggeredSuccess.current = true;
                if (activeTimerRef.current) clearInterval(activeTimerRef.current);
                setCurrentScore(requiredScore);
                setPhase('success');
                audioManager.playScoreTargetReached();

                setTimeout(() => {
                  if (isComponentMounted.current) {
                    onChallengeSuccess();
                  }
                }, 850);
              }
            }
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(processFrame);
    };

    const lastInferenceTimeRef = { current: 0 };
    rafIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [cameraState, isSimulatedCamera, phase, challengeType, requiredScore, onChallengeSuccess]);

  // Simulated Camera Mode Loop
  useEffect(() => {
    if (!isSimulatedCamera) return;

    let simScore = 0;
    const simCanvas = simCanvasRef.current;
    if (!simCanvas) return;
    const ctx = simCanvas.getContext('2d');
    if (!ctx) return;

    const renderSimFrame = (time: number) => {
      if (!isComponentMounted.current) return;
      const w = simCanvas.width;
      const h = simCanvas.height;

      // Studio background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Student Head & Face
      const headX = w / 2;
      const headY = h / 2 - 10 + Math.sin(time * 0.003) * 3;

      // Body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(headX, h + 30, 140, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(headX, headY + 15, 75, 88, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(headX - 25, headY + 5, 5, 0, Math.PI * 2);
      ctx.arc(headX + 25, headY + 5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mouth smiling
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headX, headY + 35, 18, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();

      // Simulated auto-progress in active phase
      if (phase === 'active' && !hasTriggeredSuccess.current) {
        simScore = Math.min(requiredScore, simScore + 0.8);
        const rounded = Math.round(simScore);
        setCurrentScore(rounded);

        if (rounded >= requiredScore && !hasTriggeredSuccess.current) {
          hasTriggeredSuccess.current = true;
          if (activeTimerRef.current) clearInterval(activeTimerRef.current);
          setPhase('success');
          audioManager.playScoreTargetReached();
          setTimeout(() => {
            if (isComponentMounted.current) {
              onChallengeSuccess();
            }
          }, 850);
        }
      }

      simRafIdRef.current = requestAnimationFrame(renderSimFrame);
    };

    simRafIdRef.current = requestAnimationFrame(renderSimFrame);

    return () => {
      if (simRafIdRef.current) cancelAnimationFrame(simRafIdRef.current);
    };
  }, [isSimulatedCamera, phase, requiredScore, onChallengeSuccess]);

  // Restart / Retry Challenge
  const handleRetryChallenge = () => {
    audioManager.playClick();
    ChallengeEvaluator.reset();
    setCurrentScore(0);
    setPhase('idle');
    setCountdownNum(null);
    setTimeRemaining(15);
    hasTriggeredSuccess.current = false;
    lastRenderedScoreRef.current = 0;
    lastScoreUpdateTimeRef.current = 0;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (activeTimerRef.current) clearInterval(activeTimerRef.current);
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-slate-950 text-slate-100 select-none">
      {/* ================= 1. PHÍA TRÊN: TÊN TRÒ CHƠI, ĐIỂM SỐ & TIẾN TRÌNH ================= */}
      <header className="shrink-0 h-14 px-3 sm:px-4 flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/95 z-20">
        {/* Left: Tên trò chơi & Vòng chơi */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300 tracking-wide uppercase">
              THỬ THÁCH KHUÔN MẶT
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-cyan-400 font-mono">
                VÒNG {roundNumber}/{totalRounds}
              </span>
              {/* Mini progress dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalRounds }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx + 1 < roundNumber
                        ? 'bg-emerald-400'
                        : idx + 1 === roundNumber
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Điểm số hiện tại & Nút âm thanh, nút làm lại */}
        <div className="flex items-center gap-2">
          {/* Điểm số thống nhất */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-300 font-black text-xs sm:text-sm font-mono shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <span>⭐</span>
            <span>{totalScore}</span>
            <span className="text-[10px] text-amber-200/80 font-normal">điểm</span>
          </div>

          {/* Âm thanh */}
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

          {/* Làm lại ván mới */}
          {onResetGame && (
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
          )}
        </div>
      </header>

      {/* ================= 2. KHU VỰC TRUNG TÂM: CAMERA VÀ HƯỚNG DẪN THỬ THÁCH ================= */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-1.5 w-full max-w-md mx-auto overflow-hidden">
        {/* Hướng dẫn thử thách (Compact, Colorful, High-Contrast) */}
        <div className="shrink-0 w-full mb-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-blue-950/90 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0 select-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
              {challengeInfo.icon}
            </span>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide truncate">
                  {challengeInfo.name}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded-md border border-emerald-500/40 shrink-0">
                  +{requiredScore} ĐIỂM
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-cyan-200 font-medium truncate">
                {challengeInfo.instruction}
              </p>
            </div>
          </div>

          {/* Time remaining indicator if active */}
          {phase === 'active' && (
            <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-400/60 text-amber-300 text-xs font-mono font-bold">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{timeRemaining}s</span>
            </div>
          )}
        </div>

        {/* Khung Camera Nhận Diện Khuôn Mặt (Prominent Central Anchor) */}
        <div className="flex-1 min-h-0 w-full max-w-[390px] relative flex items-center justify-center">
          <div className="relative w-full h-full max-h-[46vh] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center">
            {/* Cyber Corner Accents */}
            <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400 z-20 pointer-events-none rounded-tl-xs" />
            <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400 z-20 pointer-events-none rounded-tr-xs" />
            <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400 z-20 pointer-events-none rounded-bl-xs" />
            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400 z-20 pointer-events-none rounded-br-xs" />

            {/* Subtle Face Guide Silhouette Oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-35">
              <div className="w-[52%] h-[68%] rounded-[50%] border-2 border-dashed border-cyan-300" />
            </div>

            {/* Real Video Element */}
            {!isSimulatedCamera && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Real Landmark Canvas */}
            {!isSimulatedCamera && (
              <canvas
                ref={canvasRef}
                width={isMobileDevice() ? 480 : 640}
                height={isMobileDevice() ? 360 : 480}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />
            )}

            {/* Simulated Canvas */}
            {isSimulatedCamera && (
              <canvas
                ref={simCanvasRef}
                width={isMobileDevice() ? 480 : 640}
                height={isMobileDevice() ? 360 : 480}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Camera Status Badge */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-400/60">
              <span
                className={`w-2 h-2 rounded-full ${
                  cameraState === 'ready' || isSimulatedCamera
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] font-bold text-cyan-200 font-mono uppercase">
                {cameraState === 'ready' || isSimulatedCamera ? 'CAMERA SẴN SÀNG' : 'KẾT NỐI CAMERA...'}
              </span>
            </div>

            {/* Countdown Overlay Inside Camera */}
            {phase === 'countdown' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs z-30">
                <div className="text-6xl sm:text-7xl font-black text-amber-300 drop-shadow-[0_0_25px_#f59e0b] animate-bounce font-mono">
                  {countdownNum === 0 ? 'BẮT ĐẦU!' : countdownNum}
                </div>
                <span className="text-xs font-bold text-cyan-200 mt-2">
                  Hãy chuẩn bị biểu cảm {challengeInfo.name}!
                </span>
              </div>
            )}

            {/* Success Overlay Inside Camera */}
            {phase === 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/85 backdrop-blur-xs z-30 animate-in fade-in zoom-in duration-200">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_20px_#10B981] mb-1 animate-bounce" />
                <span className="text-xl sm:text-2xl font-black text-emerald-300 drop-shadow-md">
                  +{requiredScore} ĐIỂM!
                </span>
                <span className="text-xs font-bold text-emerald-200 mt-1">
                  Đang mở khóa câu hỏi STEM...
                </span>
              </div>
            )}

            {/* Failed Overlay */}
            {phase === 'failed' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/85 backdrop-blur-xs z-30 animate-in fade-in duration-200">
                <AlertTriangle className="w-12 h-12 text-rose-400 mb-1 animate-pulse" />
                <span className="text-lg font-black text-rose-200">
                  CHƯA ĐẠT YÊU CẦU!
                </span>
                <span className="text-xs font-bold text-rose-300 mt-1">
                  Không được cộng điểm. Hãy thử lại!
                </span>
              </div>
            )}

            {/* Camera Requesting */}
            {cameraState === 'requesting' && !isSimulatedCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-cyan-300 p-4 text-center z-25">
                <RefreshCw className="w-8 h-8 animate-spin mb-2 text-cyan-400" />
                <p className="font-bold text-xs sm:text-sm">Đang mở camera...</p>
                <p className="text-[10px] text-slate-400 mt-1">Vui lòng cho phép quyền truy cập camera</p>
              </div>
            )}

            {/* Camera Error State */}
            {cameraState === 'error' && !isSimulatedCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-red-300 p-3 text-center z-30">
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-1" />
                <p className="font-black text-xs text-amber-300">Không thể mở camera</p>
                <p className="text-[10px] text-slate-300 max-w-xs my-1">{errorMessage}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={enableSimulationMode}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] cursor-pointer"
                  >
                    Bật Camera Mô Phỏng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= 3. PHÍA DƯỚI CAMERA: ĐỒNG HỒ ĐẾM NGƯỢC VÀ TRẠNG THÁI NHẬN DIỆN ================= */}
      <section className="shrink-0 w-full max-w-md mx-auto px-4 py-1 flex flex-col items-center">
        {/* Thanh tiến độ nhận diện điểm (0/50 điểm) */}
        <div className="w-full flex items-center justify-between text-[11px] font-bold text-cyan-200 mb-1 font-mono">
          <span>Tiến độ nhận diện</span>
          <span className="text-amber-300">{currentScore} / {requiredScore} điểm</span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-900 border border-cyan-500/40 overflow-hidden shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 transition-all duration-100 rounded-full"
            style={{ width: `${Math.min(100, (currentScore / requiredScore) * 100)}%` }}
          />
        </div>

        {/* Trạng thái nhận diện ngắn gọn */}
        <div className="mt-1 text-center">
          {phase === 'idle' && (
            <span className="text-[11px] text-cyan-300 font-medium">
              👉 Nhấn <strong className="text-amber-300">BẮT ĐẦU</strong> bên dưới và nhìn thẳng vào camera
            </span>
          )}
          {phase === 'countdown' && (
            <span className="text-[11px] text-amber-300 font-bold animate-pulse">
              Đang chuẩn bị... {countdownNum} giây
            </span>
          )}
          {phase === 'active' && (
            <span className="text-[11px] text-cyan-200 font-bold animate-pulse">
              {currentScore >= requiredScore
                ? `✓ ĐÃ ĐẠT ${requiredScore} ĐIỂM! Đang chuyển tiếp...`
                : `Hãy giữ biểu cảm ${challengeInfo.name}! (${currentScore}/${requiredScore})`}
            </span>
          )}
          {phase === 'failed' && (
            <span className="text-[11px] text-rose-300 font-bold">
              Chưa hoàn thành thử thách. Nhấn Thử lại bên dưới để làm lại!
            </span>
          )}
          {phase === 'success' && (
            <span className="text-[11px] text-emerald-300 font-bold">
              ✓ Hoàn thành xuất sắc! Đang mở câu hỏi STEM...
            </span>
          )}
        </div>
      </section>

      {/* ================= 4. PHÍA DƯỚI CÙNG: NÚT BẮT ĐẦU, THỰC HIỆN LẠI HOẶC TIẾP TỤC ================= */}
      <footer className="shrink-0 w-full max-w-md mx-auto px-4 pb-3 pt-1">
        {phase === 'idle' && (
          <button
            type="button"
            onClick={handleReadyClick}
            className="w-full h-13 rounded-2xl font-black text-base sm:text-lg text-[#0b172a] uppercase tracking-wider bg-gradient-to-b from-[#FFE57F] via-[#FFC107] to-[#FF8F00] active:scale-[0.98] transition shadow-[0_4px_0_#C67100,0_8px_18px_rgba(255,179,0,0.5)] border-2 border-[#FFE082] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-[#0b172a] text-[#0b172a] animate-pulse" />
            <span>BẮT ĐẦU THỬ THÁCH ({requiredScore} ĐIỂM)</span>
          </button>
        )}

        {phase === 'countdown' && (
          <div className="w-full h-13 rounded-2xl font-black text-base text-amber-300 bg-slate-900 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center animate-pulse">
            ĐANG ĐẾM NGƯỢC ({countdownNum})...
          </div>
        )}

        {phase === 'active' && (
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetryChallenge}
              className="w-full h-13 rounded-2xl font-bold text-sm text-cyan-200 bg-blue-950/80 border border-cyan-400/50 hover:bg-blue-900 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4 text-cyan-300" />
              <span>THỰC HIỆN LẠI TỪ ĐẦU</span>
            </button>
          </div>
        )}

        {phase === 'failed' && (
          <button
            type="button"
            onClick={handleRetryChallenge}
            className="w-full h-13 rounded-2xl font-black text-base text-white uppercase tracking-wider bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>THỰC HIỆN LẠI THỬ THÁCH (0 ĐIỂM)</span>
          </button>
        )}

        {phase === 'success' && (
          <div className="w-full h-13 rounded-2xl font-black text-base text-emerald-300 bg-emerald-950/90 border border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>✓ ĐẠT {requiredScore} ĐIỂM! ĐANG MỞ CÂU HỎI...</span>
          </div>
        )}
      </footer>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetConfirm}
        onConfirm={() => {
          setShowResetConfirm(false);
          if (onResetGame) onResetGame();
        }}
        onCancel={() => setShowResetConfirm(false)}
        title="LÀM LẠI VÁN MỚI?"
        description="Bạn có chắc chắn muốn bắt đầu lại ván mới từ đầu? Toàn bộ điểm và tiến trình sẽ được đặt lại."
      />
    </div>
  );
};
