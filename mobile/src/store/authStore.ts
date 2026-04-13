import { create } from 'zustand';

interface User {
  id: number;
  nickname: string;
  email: string;
  saldo: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  selectedLigaId: number | null;
  selectedLigaNombre: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setSelectedLiga: (ligaId: number | null, ligaNombre?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  selectedLigaId: null,
  selectedLigaNombre: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  setSelectedLiga: (ligaId, ligaNombre = null) => set({ selectedLigaId: ligaId, selectedLigaNombre: ligaNombre }),
  logout: () => set({ user: null, token: null, selectedLigaId: null, selectedLigaNombre: null, isAuthenticated: false }),
}));
