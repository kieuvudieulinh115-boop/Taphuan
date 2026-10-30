import { ChallengeType } from '../types';

export interface FixedRoundInfo {
  roundNumber: number; // 1 to 9
  challengeType: ChallengeType;
  pieceId: number; // 0 to 8 (Shuffled non-sequential to increase challenge!)
  questionIndex: number; // 0 to 8
  scoreReward: number; // 50
  requiredScore: number; // 50
}

/**
 * 9 VÒNG CHƠI VỚI THỨ TỰ MẢNH GHÉP ĐƯỢC XÁO TRỘN ĐỂ TĂNG ĐỘ KHÓ
 * Không theo thứ tự 0, 1, 2, 3...
 * Thay vào đó, học sinh nhận các mảnh ghép xen kẽ: Tâm -> Góc -> Cạnh -> Góc...
 * Yêu cầu học sinh phải tự quan sát hình ảnh và biên dạng khớp nối để tìm đúng vị trí.
 * 
 * Thứ tự mảnh ghép xáo trộn:
 * Vòng 1: Mảnh 4 (Tâm chính giữa)
 * Vòng 2: Mảnh 0 (Góc trên - trái)
 * Vòng 3: Mảnh 7 (Cạnh dưới - giữa)
 * Vòng 4: Mảnh 2 (Góc trên - phải)
 * Vòng 5: Mảnh 3 (Cạnh giữa - trái)
 * Vòng 6: Mảnh 8 (Góc dưới - phải)
 * Vòng 7: Mảnh 1 (Cạnh trên - giữa)
 * Vòng 8: Mảnh 6 (Góc dưới - trái)
 * Vòng 9: Mảnh 5 (Cạnh giữa - phải)
 */
export const FIXED_GAME_ROUNDS: FixedRoundInfo[] = [
  {
    roundNumber: 1,
    challengeType: 'smile',
    pieceId: 4, // Tâm chính giữa
    questionIndex: 0,
    scoreReward: 50,
    requiredScore: 50
  },
  {
    roundNumber: 2,
    challengeType: 'wink_left',
    pieceId: 0, // Góc trên trái
    questionIndex: 1,
    scoreReward: 20,
    requiredScore: 20
  },
  {
    roundNumber: 3,
    challengeType: 'mouth_open',
    pieceId: 7, // Cạnh dưới giữa
    questionIndex: 2,
    scoreReward: 50,
    requiredScore: 50
  },
  {
    roundNumber: 4,
    challengeType: 'wink_right',
    pieceId: 2, // Góc trên phải
    questionIndex: 3,
    scoreReward: 20,
    requiredScore: 20
  },
  {
    roundNumber: 5,
    challengeType: 'mouth_pucker',
    pieceId: 3, // Cạnh giữa trái
    questionIndex: 4,
    scoreReward: 50,
    requiredScore: 50
  },
  {
    roundNumber: 6,
    challengeType: 'brow_raise',
    pieceId: 8, // Góc dưới phải
    questionIndex: 5,
    scoreReward: 50,
    requiredScore: 50
  },
  {
    roundNumber: 7,
    challengeType: 'cheek_puff',
    pieceId: 1, // Cạnh trên giữa
    questionIndex: 6,
    scoreReward: 20,
    requiredScore: 20
  },
  {
    roundNumber: 8,
    challengeType: 'head_nod',
    pieceId: 6, // Góc dưới trái
    questionIndex: 7,
    scoreReward: 50,
    requiredScore: 50
  },
  {
    roundNumber: 9,
    challengeType: 'grin',
    pieceId: 5, // Cạnh giữa phải
    questionIndex: 8,
    scoreReward: 50,
    requiredScore: 50
  }
];

export const TOTAL_GAME_ROUNDS = FIXED_GAME_ROUNDS.length; // 9
export const MAX_TOTAL_SCORE = FIXED_GAME_ROUNDS.reduce((sum, r) => sum + r.scoreReward, 0); // 360
