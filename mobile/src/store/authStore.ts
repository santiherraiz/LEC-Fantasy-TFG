import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

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
  pushToken: string | null;
  pendingReveal: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setPushToken: (token: string | null) => void;
  setSelectedLiga: (ligaId: number | null, ligaNombre?: string | null) => void;
  setPendingReveal: (pending: boolean) => void;
  logout: () => void;
}

// Adaptador para SecureStore (Zustand espera getItem, setItem, removeItem)
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      selectedLigaId: null,
      selectedLigaNombre: null,
      pushToken: null,
      pendingReveal: false,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setPushToken: (token) => set({ pushToken: token }),
      setSelectedLiga: (ligaId, ligaNombre = null) => set({ selectedLigaId: ligaId, selectedLigaNombre: ligaNombre }),
      setPendingReveal: (pending) => set({ pendingReveal: pending }),
      logout: () => set({ 
        user: null, 
        token: null, 
        selectedLigaId: null, 
        selectedLigaNombre: null, 
        pushToken: null, 
        pendingReveal: false,
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
