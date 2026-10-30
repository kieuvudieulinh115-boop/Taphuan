import confetti from 'canvas-confetti';

/**
 * Pháo hoa confetti khi trả lời đúng câu hỏi trắc nghiệm
 */
export function fireQuestionCorrectConfetti() {
  try {
    // Bắn chùm pháo hoa rực rỡ từ tâm màn hình
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#00F0FF', '#F59E0B', '#10B981', '#FFD700', '#38BDF8', '#F43F5E'],
      ticks: 220,
      gravity: 1.0,
      scalar: 1.1,
      zIndex: 99999
    });

    // Thêm một chùm nhỏ lệch trái và phải để tạo hiệu ứng pháo hoa nở rộ
    setTimeout(() => {
      confetti({
        particleCount: 35,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#FFD700', '#F59E0B', '#00F0FF'],
        zIndex: 99999
      });
      confetti({
        particleCount: 35,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#10B981', '#00F0FF', '#FBBF24'],
        zIndex: 99999
      });
    }, 120);
  } catch (err) {
    console.warn('Không thể bắn confetti:', err);
  }
}

/**
 * Pháo hoa confetti khi đặt mảnh ghép tranh thành công
 */
export function firePiecePlacedConfetti() {
  try {
    // Bắn chùm pháo hoa chúc mừng ghép mảnh thành công
    confetti({
      particleCount: 55,
      spread: 80,
      startVelocity: 30,
      origin: { x: 0.5, y: 0.45 },
      colors: ['#F59E0B', '#FFD700', '#00F0FF', '#10B981', '#EC4899'],
      ticks: 200,
      gravity: 1.1,
      scalar: 1.15,
      zIndex: 99999
    });
  } catch (err) {
    console.warn('Không thể bắn confetti:', err);
  }
}

/**
 * Đại tiệc pháo hoa chiến thắng khi hoàn thành trọn vẹn bức tranh
 */
export function fireGrandVictoryConfetti() {
  try {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }

      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#00F0FF', '#F59E0B', '#10B981', '#FFD700', '#EC4899', '#8B5CF6'],
        zIndex: 99999
      });
    }, 250);
  } catch (err) {
    console.warn('Không thể bắn confetti:', err);
  }
}
