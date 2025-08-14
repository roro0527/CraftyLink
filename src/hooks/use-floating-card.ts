import { create } from 'zustand';

type FloatingCardStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useFloatingCard = create<FloatingCardStore>((set) => ({
  isOpen: true,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
