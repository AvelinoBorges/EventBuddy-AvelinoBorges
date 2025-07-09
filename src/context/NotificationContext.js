import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    eventsReminder: true,
    favoriteEvents: true,
    nearbyEvents: true,
    reminderTime: 30, // minutos antes do evento
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  // Carregar configurações do AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('notificationSettings');
        if (saved) {
          setNotificationSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de notificação:', error);
      }
    };

    loadSettings();
  }, []);

  // Inicializar notificações quando o usuário estiver logado
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user || isInitialized) return;

      try {
        // Solicitar permissões
        const granted = await notificationService.requestPermissions();
        setPermissionGranted(granted);

        if (granted) {
          // Salvar token do usuário
          await notificationService.saveUserToken(user.uid);
          console.log('Notificações inicializadas com sucesso');
        } else {
          // Mostrar alerta se permissão foi negada
          Alert.alert(
            'Permissão de Notificação',
            'Para receber lembretes de eventos, ative as notificações nas configurações do dispositivo.',
            [
              { text: 'Agora não', style: 'cancel' },
              { text: 'Configurações', onPress: () => {
                // Aqui você pode abrir as configurações do app
                console.log('Abrir configurações do sistema');
              }}
            ]
          );
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error);
        setIsInitialized(true);
      }
    };

    initializeNotifications();
  }, [user, isInitialized]);

  // Salvar configurações no AsyncStorage
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  // Atualizar configuração específica
  const updateSetting = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    await saveSettings(newSettings);
  };

  // Agendar lembrete para evento
  const scheduleEventReminder = async (event) => {
    if (!permissionGranted || !notificationSettings.eventsReminder) {
      return null;
    }

    try {
      const notificationId = await notificationService.scheduleEventReminder(
        event,
        notificationSettings.reminderTime
      );

      if (notificationId) {
        console.log(`Lembrete agendado para ${event.title}`);
        return notificationId;
      }
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
    }
    return null;
  };

  // Cancelar lembretes de evento
  const cancelEventReminders = async (eventId) => {
    try {
      await notificationService.cancelEventReminders(eventId);
      console.log('Lembretes cancelados para o evento');
    } catch (error) {
      console.error('Erro ao cancelar lembretes:', error);
    }
  };

  // Notificar sobre eventos próximos
  const notifyNearbyEvents = async (userLocation, events) => {
    if (!permissionGranted || !notificationSettings.nearbyEvents) {
      return;
    }

    try {
      await notificationService.notifyNearbyEvents(userLocation, events);
    } catch (error) {
      console.error('Erro ao notificar eventos próximos:', error);
    }
  };

  // Notificar sobre evento favorito
  const notifyFavoriteEvent = async (event) => {
    if (!permissionGranted || !notificationSettings.favoriteEvents) {
      return;
    }

    try {
      await notificationService.notifyFavoriteEventStarting(event);
    } catch (error) {
      console.error('Erro ao notificar evento favorito:', error);
    }
  };

  // Limpar todas as notificações
  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      console.log('Todas as notificações foram limpatempo');
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  // Obter notificações agendadas
  const getScheduledNotifications = async () => {
    try {
      return await notificationService.getScheduledNotifications();
    } catch (error) {
      console.error('Erro ao obter notificações agendadas:', error);
      return [];
    }
  };

  // Solicitar permissões novamente
  const requestPermissions = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  };

  // Função de teste para desenvolvimento (apenas notificações locais)
  const testLocalNotifications = async () => {
    if (!permissionGranted) {
      Alert.alert(
        'Permissão Necessária',
        'Permissão de notificação é necessária para testar.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      // Notificação de teste imediata
      await notificationService.scheduleNotificationAsync({
        content: {
          title: "🎉 Event Buddy - Teste",
          body: "Notificação local funcionando!",
          data: { test: true },
        },
        trigger: { seconds: 2 },
      });

      // Notificação de teste para evento
      await notificationService.scheduleNotificationAsync({
        content: {
          title: "📅 Lembrete de Evento",
          body: "Evento de teste em 30 minutos!",
          data: { eventId: 'test-event' },
        },
        trigger: { seconds: 10 },
      });

      Alert.alert(
        'Teste Agendado',
        'Duas notificações de teste foram agendadas:\n• 2 segundos (imediata)\n• 10 segundos (lembrete)',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao testar notificações:', error);
      Alert.alert('Erro', 'Falha ao agendar notificações de teste');
      return false;
    }
  };

  const value = {
    notificationSettings,
    permissionGranted,
    isInitialized,
    updateSetting,
    scheduleEventReminder,
    cancelEventReminders,
    notifyNearbyEvents,
    notifyFavoriteEvent,
    clearAllNotifications,
    getScheduledNotifications,
    requestPermissions,
    testLocalNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};
