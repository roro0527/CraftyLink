
import { create } from 'zustand';

// 저장된 비교 항목의 타입 정의 (Firestore 문서와 일치시킴)
export interface SavedComparison {
  id: string; // Firestore 문서 ID
  name: string;
  color: string;
  keywords: string[];
  date: string; // ISO 문자열 형식
  userId: string;
}

// 스토어의 상태(state)와 액션(action)에 대한 타입 정의
interface CompareState {
  keywords: string[]; // 현재 비교 중인 키워드 목록
  setKeywords: (keywords: string[]) => void;
  addKeyword: (keyword: string) => void;
  removeKeyword: (keywordToRemove: string) => void;
  clearKeywords: () => void;
  // Firestore 연동으로 인해 savedItems 및 관련 액션은 스토어에서 제거됩니다.
}

/**
 * 키워드 비교 관련 상태를 관리하는 Zustand 스토어.
 * Firestore 연동으로 인해 더 이상 로컬 저장을 사용하지 않습니다.
 */
export const useCompareStore = create<CompareState>()(
    (set) => ({
      // --- State ---
      keywords: [],

      // --- Actions ---
      setKeywords: (keywords) => set({ keywords }),
      
      addKeyword: (keyword) =>
        set((state) => ({
          // 최대 5개 키워드 제한 유지
          keywords: state.keywords.length < 5 ? [...state.keywords, keyword] : state.keywords,
        })),

      removeKeyword: (keywordToRemove) =>
        set((state) => ({
          keywords: state.keywords.filter((k) => k !== keywordToRemove),
        })),
        
      clearKeywords: () => set({ keywords: [] }),
    })
);
