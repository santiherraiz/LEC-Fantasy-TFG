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

// Aquí abajo (o arriba) la IA ya podrá meter interceptors de respuesta (response) 
// para manejar los errores 400 y 401 sin que el script update-ip.js lo borre todo.

export default api;