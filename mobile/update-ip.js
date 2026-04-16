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
  // Si falla o no hay internet, por defecto usa la IP del emulador de Android
  return '10.0.2.2';
}

const localIp = getLocalIp();
// Ahora apuntamos a un nuevo archivo llamado config.ts
const configPath = path.join(__dirname, 'src', 'api', 'config.ts');

const configContent = `// ⚠️ ARCHIVO AUTOGENERADO POR update-ip.js ⚠️
// No edites este archivo a mano. Tu IP local se actualizará sola al arrancar el proyecto.

export const API_URL = 'http://${localIp}:8080/api';
`;

fs.writeFileSync(configPath, configContent);
console.log(`\x1b[32m[IP Sync]\x1b[0m Archivo src/api/config.ts actualizado con la URL: http://${localIp}:8080/api`);