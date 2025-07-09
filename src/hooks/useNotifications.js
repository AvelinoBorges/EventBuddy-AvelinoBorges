import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const initializationRef = useRef(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (initializationRef.current || !user) return;
      
      initializationRef.current = true;
      
      try {
        // Solicitar permissões
        const granted = await notificationService.requestPermissions();
        setPermissionGranted(granted);
        
        if (granted) {
          // Salvar token do usuário
          await notificationService.saveUserToken(user.uid);
          
          // Configurar listeners
          notificationService.setupNotificationListeners(navigation);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error);
        setIsInitialized(true);
      }
    };

    initializeNotifications();

    // Cleanup
    return () => {
      if (initializationRef.current) {
        notificationService.removeNotificationListeners();
      }
    };
  }, [user, navigation]);

  // Agendar lembrete para um evento
  const scheduleEventReminder = async (event, reminderMinutes = 30) => {
    if (!permissionGranted) {
      console.log('Permissão de notificação não concedida');
      return null;
    }

    try {
      const notificationId = await notificationService.scheduleEventReminder(event, reminderMinutes);
      return notificationId;
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
      return null;
    }
  };

  // Cancelar lembretes de um evento
  const cancelEventReminders = async (eventId) => {
    try {
      await notificationService.cancelEventReminders(eventId);
    } catch (error) {
      console.error('Erro ao cancelar lembretes:', error);
    }
  };

  // Notificar sobre eventos próximos
  const notifyNearbyEvents = async (userLocation, events) => {
    if (!permissionGranted) return;

    try {
      await notificationService.notifyNearbyEvents(userLocation, events);
    } catch (error) {
      console.error('Erro ao notificar eventos próximos:', error);
    }
  };

  // Limpar todas as notificações
  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
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

  return {
    permissionGranted,
    isInitialized,
    scheduleEventReminder,
    cancelEventReminders,
    notifyNearbyEvents,
    clearAllNotifications,
    getScheduledNotifications
  };
};
