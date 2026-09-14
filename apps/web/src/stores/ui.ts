import { create } from "zustand";

interface UiState {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  scrolled: boolean;
  setScrolled: (scrolled: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  scrolled: false,
  setScrolled: (scrolled) => set({ scrolled }),
}));
