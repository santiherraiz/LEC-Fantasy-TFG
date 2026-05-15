# FantasyLEC 🎮

FantasyLEC es una aplicación de Fantasy Sports dedicada a la League of Legends EMEA Championship (LEC). Los usuarios pueden crear sus propios equipos, fichar jugadores reales basándose en estadísticas en vivo y competir en ligas privadas.

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para poner el proyecto en marcha en tu máquina local.

### 1. Requisitos Previos
* **Docker Desktop**: Para la base de datos y el backend.
* **Node.js (v18+)**: Para la aplicación móvil.
* **Java 21**: Solo si deseas ejecutar el backend sin Docker.
* **Expo Go**: Descárgalo en tu móvil (iOS/Android) para visualizar la aplicación.

### 2. Clonar y Levantar Infraestructura (Backend)
El proyecto utiliza Docker Compose para simplificar la configuración de la base de datos (MariaDB) y el servidor (Spring Boot).

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/FantasyLEC.git
cd FantasyLEC

# 2. Levantar la base de datos y el backend
docker-compose up -d
```
*   **Base de datos**: Estará disponible en el puerto `3307`.
*   **API Backend**: Estará disponible en el puerto `8080`.
*   **Swagger (Documentación API)**: Puedes verla en `http://localhost:8080/swagger-ui.html` una vez que el backend haya arrancado.

### 3. Ejecutar la Aplicación Móvil
La app móvil está desarrollada con Expo y detecta automáticamente la IP de tu servidor sin configuraciones manuales.

```bash
cd mobile

# 1. Instalar dependencias
npm install

# 2. Iniciar la app
npm start
```

### 4. Visualización en el Móvil
1. Asegúrate de que tu ordenador y tu móvil estén conectados a la **misma red Wi-Fi**.
2. Abre la app **Expo Go** en tu móvil.
3. Escanea el código QR que aparecerá en tu terminal.

---

## 🛠️ Estructura del Proyecto
*   `/backend`: API REST construida con **Spring Boot 3.4**, **Spring Security (JWT)** y **JPA/Hibernate**.
*   `/mobile`: Aplicación móvil construida con **React Native**, **Expo Router**, **NativeWind (Tailwind)** y **Zustand** para el estado.
*   `docker-compose.yml`: Orquestación de contenedores para MariaDB y el Backend.

## 📝 Notas para Profesores
*   **Cuentas de prueba**: El sistema arranca vacío por defecto. La primera vez que abras la app, deberás registrarte como nuevo usuario.
*   **Sincronización de Datos**: El backend incluye servicios que se conectan a la API de Leaguepedia para obtener datos reales de los jugadores de la LEC.
*   **Persistencia**: Los datos se guardan en el volumen de Docker definido, por lo que no se pierden al reiniciar los contenedores.
