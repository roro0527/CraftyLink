
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 저장된 비교 항목의 타입 정의
export interface SavedComparison {
  id: number;
  name: string;
  color: string;
  keywords: string[];
  date: string;
}

// 스토어의 상태(state)와 액션(action)에 대한 타입 정의
interface CompareState {
  keywords: string[]; // 현재 비교 중인 키워드 목록
  savedItems: SavedComparison[]; // 저장된 비교 목록
  setKeywords: (keywords: string[]) => void;
  addKeyword: (keyword: string) => void;
  removeKeyword: (keywordToRemove: string) => void;
  clearKeywords: () => void;
  addSavedItem: (item: SavedComparison) => void;
  removeSavedItem: (id: number) => void;
}

// 초기 저장된 비교 목록 목업 데이터
const initialSavedComparisons = [
  {
    id: 1,
    name: '2분기 스마트폰 시장',
    color: 'bg-blue-500',
    keywords: ['갤럭시', '아이폰'],
    date: '2023-06-28',
  },
  {
    id: 2,
    name: '여름 휴가 여행지',
    color: 'bg-green-500',
    keywords: ['제주도', '강릉', '부산'],
    date: '2023-06-25',
  },
  {
    id: 3,
    name: 'OTT 서비스 경쟁',
    color: 'bg-red-500',
    keywords: ['넷플릭스', '디즈니플러스', '티빙'],
    date: '2023-06-22',
  },
];


/**
 * 키워드 비교 관련 상태를 관리하는 Zustand 스토어.
 * `persist` 미들웨어를 사용하여 `savedItems`를 localStorage에 저장하고 복원합니다.
 */
export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      // --- State ---
      keywords: [],
      savedItems: initialSavedComparisons,

      // --- Actions ---
      setKeywords: (keywords) => set({ keywords }),
      
      addKeyword: (keyword) =>
        set((state) => ({
          keywords: [...state.keywords, keyword],
        })),

      removeKeyword: (keywordToRemove) =>
        set((state) => ({
          keywords: state.keywords.filter((k) => k !== keywordToRemove),
        })),
        
      clearKeywords: () => set({ keywords: [] }),

      addSavedItem: (item) =>
        set((state) => ({
          savedItems: [item, ...state.savedItems],
        })),

      removeSavedItem: (id) =>
        set((state) => ({
          savedItems: state.savedItems.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'compare-storage', // localStorage에 저장될 때 사용될 키 이름
      storage: createJSONStorage(() => localStorage), // 사용할 스토리지 (localStorage)
      partialize: (state) => ({ savedItems: state.savedItems }), // `savedItems`만 영속성 관리 대상으로 지정
    }
  )
);
