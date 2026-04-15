import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Dimensions, Platform } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, []);

  const showToast = useCallback((msg: string, toastType: ToastType = 'info') => {
    // Si ya hay un temporizador corriendo, lo limpiamos
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(msg);
    setType(toastType);
    setVisible(true);

    // Animación de entrada
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: insets.top + 10,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-ocultar después de 3 segundos
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, 3000);
  }, [insets.top, hideToast]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle color="#10B981" size={20} />;
      case 'error': return <AlertCircle color="#EF4444" size={20} />;
      default: return <Info color="#3B82F6" size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#10B98150';
      case 'error': return '#EF444450';
      default: return '#3B82F650';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              opacity, 
              transform: [{ translateY }],
              borderColor: getBorderColor(),
              backgroundColor: '#1F2937', 
            }
          ]}
        >
          <View style={styles.iconContainer}>{getIcon()}</View>
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginRight: 12,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
