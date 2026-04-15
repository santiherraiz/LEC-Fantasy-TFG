import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// IP detectada automáticamente: 192.168.1.32
const API_URL = 'http://192.168.1.32:8080/api'; 

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

export default api;
