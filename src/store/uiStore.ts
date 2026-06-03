import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  globalLoading: boolean;
  toggleSidebar: () => void;
  setGlobalLoading: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  globalLoading: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setGlobalLoading: (val) => set({ globalLoading: val }),
}));