import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';

// Intentamos importar los módulos nativos de forma segura
let Device: any = null;
let Notifications: any = null;

try {
  Device = require('expo-device');
  Notifications = require('expo-notifications');
  
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.log("Native notification modules not available");
}

export const useNotifications = () => {
  const { user, setPushToken } = useAuthStore();
  const [notification, setNotification] = useState<any>(null);
  const notificationListener = useRef<any>(undefined);
  const responseListener = useRef<any>(undefined);

  useEffect(() => {
    if (!Notifications) {
      console.log("Notificaciones desactivadas: Módulos nativos no encontrados.");
      return;
    }

    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setPushToken(token);
          saveTokenToBackend(token);
        }
      });
    }

    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  const saveTokenToBackend = async (token: string) => {
    if (!user?.id) return;
    try {
      await api.post('/usuarios/update-push-token', null, {
        params: {
          usuarioId: user.id,
          token: token
        }
      });
      console.log("Push token guardado en el backend correctamente");
    } catch (error) {
      console.error("Error guardando el push token en el backend:", error);
    }
  };

  async function registerForPushNotificationsAsync() {
    if (!Notifications) return;
    
    let token;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00D1FF',
        });
      } catch (e) {
        console.log("Error setting notification channel", e);
      }
    }

    // Verificación de seguridad para el módulo nativo
    const isDevice = Device?.isDevice ?? false;

    if (isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Fallo al obtener el permiso para notificaciones push');
        return;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({
          projectId
        })).data;
      } catch (e) {
        console.error("Error getting push token:", e);
      }
    } else {
      console.log('Notificaciones: Módulo nativo no disponible (reconstrucción necesaria o simulador)');
    }

    return token;
  }

  return { notification };
};
