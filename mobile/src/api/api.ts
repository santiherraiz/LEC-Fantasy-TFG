import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from './config'; // Importamos la IP generada automáticamente

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejo global de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error viene del backend (trae respuesta JSON)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Mensaje amigable por defecto según el código de estado
      let message = data.message || 'Ocurrió un error inesperado';
      
      if (status === 401) message = 'Sesión expirada o credenciales inválidas';
      if (status === 403) message = 'No tienes permiso para realizar esta acción';
      if (status === 404) message = 'Recurso no encontrado';
      if (status === 500) message = 'Error interno del servidor. Inténtalo más tarde';

      // Creamos un nuevo error con el mensaje limpio para que el componente lo use
      const cleanError = new Error(message);
      (cleanError as any).status = status;
      return Promise.reject(cleanError);
    }
    
    // Si es un error de red (sin respuesta del servidor)
    if (error.request) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Revisa tu conexión.'));
    }

    return Promise.reject(error);
  }
);

export default api;