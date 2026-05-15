import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, selectedLigaId } = useAuthStore();

  // Esta página sirve como punto de entrada raíz para evitar el error "Unmatched Route"
  // aunque el _layout.tsx ya tiene lógica de redirección, tener un punto de entrada siempre está bien

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!selectedLigaId) {
    return <Redirect href="/league-selection" />;
  }

  return <Redirect href="/equipo" />;
}