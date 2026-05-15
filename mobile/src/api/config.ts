import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * CONFIGURACIÓN DINÁMICA DE LA API
 * 
 * En lugar de escribir la IP a mano, la detectamos en tiempo de ejecución.
 */
const getBackendUrl = () => {
  // 1. Intentamos obtener la IP desde la que Expo está sirviendo el proyecto
  // Esto permite que el móvil físico se conecte al PC automáticamente.
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8080/api`;
  }

  // 2. Fallback (Plan B): Si falla la detección o estamos en un emulador
  // Android usa la IP especial 10.0.2.2 para referirse al "localhost" del PC.
  const localhost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${localhost}:8080/api`;
};

export const API_URL = getBackendUrl();
console.log('[API] Conectando a:', API_URL);

