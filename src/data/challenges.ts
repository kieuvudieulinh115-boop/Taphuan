import { ChallengeInfo, ChallengeType } from '../types';

export const CHALLENGE_DEFINITIONS: Record<ChallengeType, ChallengeInfo> = {
  mouth_pucker: {
    id: 'mouth_pucker',
    name: 'CHU MÔI',
    instruction: 'Hãy CHU MÔI để nhận 50 điểm!',
    defaultScore: 50,
    icon: '😗'
  },
  smile: {
    id: 'smile',
    name: 'CƯỜI MỈM',
    instruction: 'Hãy CƯỜI MỈM tươi tắn để nhận 50 điểm!',
    defaultScore: 50,
    icon: '😊'
  },
  grin: {
    id: 'grin',
    name: 'CƯỜI LỘ RĂNG',
    instruction: 'Hãy CƯỜI LỘ RĂNG rạng rỡ để nhận 50 điểm!',
    defaultScore: 50,
    icon: '😁'
  },
  wink_left: {
    id: 'wink_left',
    name: 'NHÁY MẮT TRÁI',
    instruction: 'Hãy NHÁY MẮT TRÁI để nhận 20 điểm!',
    defaultScore: 20,
    icon: '😉'
  },
  wink_right: {
    id: 'wink_right',
    name: 'NHÁY MẮT PHẢI',
    instruction: 'Hãy NHÁY MẮT PHẢI để nhận 20 điểm!',
    defaultScore: 20,
    icon: '😜'
  },
  eyes_closed: {
    id: 'eyes_closed',
    name: 'NHẮM HAI MẮT',
    instruction: 'Hãy NHẮM CẢ HAI MẮT để nhận 50 điểm!',
    defaultScore: 50,
    icon: '😌'
  },
  mouth_open: {
    id: 'mouth_open',
    name: 'MỞ MIỆNG',
    instruction: 'Hãy MỞ MIỆNG vừa phải để nhận 50 điểm!',
    defaultScore: 50,
    icon: '😮'
  },
  mouth_stretch: {
    id: 'mouth_stretch',
    name: 'HÁ MIỆNG TO',
    instruction: 'Hãy HÁ MIỆNG THẬT TO để nhận 50 điểm!',
    defaultScore: 50,
    icon: '😲'
  },
  head_shake: {
    id: 'head_shake',
    name: 'LẮC ĐẦU',
    instruction: 'Hãy LẮC ĐẦU SANG HAI BÊN để nhận 50 điểm!',
    defaultScore: 50,
    icon: '↔️'
  },
  head_nod: {
    id: 'head_nod',
    name: 'GẬT ĐẦU',
    instruction: 'Hãy GẬT ĐẦU LÊN XUỐNG để nhận 50 điểm!',
    defaultScore: 50,
    icon: '↕️'
  },
  cheek_puff: {
    id: 'cheek_puff',
    name: 'PHỒNG MÁ',
    instruction: 'Hãy PHỒNG CĂNG HAI MÁ để nhận 20 điểm!',
    defaultScore: 20,
    icon: '🐡'
  },
  brow_raise: {
    id: 'brow_raise',
    name: 'NÂNG CHÂN MÀY',
    instruction: 'Hãy NÂNG CAO HAI CHÂN MÀY để nhận 50 điểm!',
    defaultScore: 50,
    icon: '🤨'
  }
};

export const ALL_CHALLENGE_KEYS = Object.keys(CHALLENGE_DEFINITIONS) as ChallengeType[];
