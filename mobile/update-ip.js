const fs = require('fs');
const os = require('os');
const path = require('path');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Buscamos una IPv4 que no sea interna (127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIp();
const filePath = path.join(__dirname, 'src', 'api', 'api.ts');

const apiContent = `import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// IP detectada automáticamente: ${localIp}
const API_URL = 'http://${localIp}:8080/api'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, 
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
`;

fs.writeFileSync(filePath, apiContent);
console.log(`\x1b[32m[IP Sync]\x1b[0m Archivo api.ts actualizado con la IP: ${localIp}`);
