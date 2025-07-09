import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import expoConfig from '../config/expo';

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isExpoGo = expoConfig.isExpoGo;
  }

  // Solicitar permissões e obter token
  async requestPermissions() {
    try {
      // Verificar se está rodando no Expo Go
      if (this.isExpoGo) {
        console.warn('Notificações push não são totalmente suportadas no Expo Go. Use um development build para funcionalidade completa.');
        
        // Ainda assim, permitir notificações locais
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          return newStatus === 'granted';
        }
        return true;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Permissão de notificação negada');
          return false;
        }
        
        // Obter token do Expo Push apenas se não estiver no Expo Go
        if (!this.isExpoGo) {
          try {
            this.expoPushToken = (await Notifications.getExpoPushTokenAsync({
              projectId: expoConfig.projectId,
            })).data;
          } catch (error) {
            console.warn('Erro ao obter token push:', error.message);
            // Continuar sem token push para notificações locais
          }
        }
        
        if (this.expoPushToken) {
          console.log('Token de notificação:', this.expoPushToken);
        } else {
          console.log('Rodando em modo desenvolvimento - apenas notificações locais disponíveis');
        }
        return true;
      } else {
        console.log('Deve usar um dispositivo físico para notificações push');
        
        // Mesmo no simulador, permitir notificações locais
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          return newStatus === 'granted';
        }
        return true;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões de notificação:', error);
      return false;
    }
  }

  // Salvar token do usuário no Firestore
  async saveUserToken(userId) {
    if (!this.expoPushToken) {
      console.log('Sem token push para salvar - rodando em modo desenvolvimento');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: this.expoPushToken,
        tokenUpdatedAt: serverTimestamp(),
        deviceType: Platform.OS,
        isExpoGo: this.isExpoGo,
      });
      console.log('Token salvo no Firestore');
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  // Configurar listeners de notificações
  setupNotificationListeners(navigation) {
    // Listener para notificações recebidas enquanto o app está em primeiro plano
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
      // Aqui você pode adicionar lógica personalizada
    });

    // Listener para quando o usuário toca na notificação
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Resposta da notificação:', response);
      
      const { eventId, screen } = response.notification.request.content.data || {};
      
      if (eventId && navigation) {
        // Navegar para a tela de detalhes do evento
        navigation.navigate('EventDetails', { eventId });
      }
    });
  }

  // Remover listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Agendar notificação local
  async scheduleLocalNotification(title, body, data = {}, scheduledTime) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: scheduledTime ? { date: scheduledTime } : null,
      });
      
      console.log('Notificação agendada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return null;
    }
  }

  // Método para agendar notificação (compatível com contexto)
  async scheduleNotificationAsync(notificationRequest) {
    try {
      return await Notifications.scheduleNotificationAsync(notificationRequest);
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      throw error;
    }
  }

  // Cancelar notificação agendada
  async cancelScheduledNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notificação cancelada:', notificationId);
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  }

  // Agendar notificação para evento próximo
  async scheduleEventReminder(event, reminderTime = 30) {
    try {
      const eventDate = new Date(event.date + 'T' + event.time);
      const reminderDate = new Date(eventDate.getTime() - (reminderTime * 60 * 1000));
      
      // Só agendar se a data do lembrete for no futuro
      if (reminderDate > new Date()) {
        const title = `Evento em ${reminderTime} minutos!`;
        const body = `${event.title} começa às ${event.time}`;
        const data = {
          eventId: event.id,
          type: 'event_reminder',
          screen: 'EventDetails'
        };
        
        const notificationId = await this.scheduleLocalNotification(
          title,
          body,
          data,
          reminderDate
        );
        
        // Salvar ID da notificação no evento para poder cancelar depois
        if (notificationId) {
          await this.saveEventNotificationId(event.id, notificationId);
        }
        
        return notificationId;
      }
    } catch (error) {
      console.error('Erro ao agendar lembrete do evento:', error);
      return null;
    }
  }

  // Salvar ID da notificação no evento
  async saveEventNotificationId(eventId, notificationId) {
    try {
      await addDoc(collection(db, 'notifications'), {
        eventId,
        notificationId,
        type: 'event_reminder',
        createdAt: serverTimestamp(),
        status: 'scheduled'
      });
    } catch (error) {
      console.error('Erro ao salvar ID da notificação:', error);
    }
  }

  // Cancelar lembretes de um evento
  async cancelEventReminders(eventId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('eventId', '==', eventId),
        where('type', '==', 'event_reminder'),
        where('status', '==', 'scheduled')
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        await this.cancelScheduledNotification(data.notificationId);
        
        // Atualizar status no Firestore
        await updateDoc(doc(db, 'notifications', docSnap.id), {
          status: 'cancelled',
          cancelledAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar lembretes do evento:', error);
    }
  }

  // Notificação para novos eventos próximos
  async notifyNearbyEvents(userLocation, events) {
    try {
      const nearbyEvents = events.filter(event => {
        if (!event.latitude || !event.longitude) return false;
        
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.latitude,
          event.longitude
        );
        
        return distance <= 5; // Eventos num raio de 5km
      });
      
      if (nearbyEvents.length > 0) {
        const title = `${nearbyEvents.length} eventos próximos encontrados!`;
        const body = `Descubra eventos interessantes na sua região`;
        const data = {
          type: 'nearby_events',
          screen: 'EventsList'
        };
        
        await this.scheduleLocalNotification(title, body, data);
      }
    } catch (error) {
      console.error('Erro ao notificar eventos próximos:', error);
    }
  }

  // Calcular distância entre dois pontos
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Notificação para quando um evento favorito está prestes a começar
  async notifyFavoriteEventStarting(event) {
    try {
      const title = `Seu evento favorito está começando!`;
      const body = `${event.title} começa agora`;
      const data = {
        eventId: event.id,
        type: 'favorite_event_starting',
        screen: 'EventDetails'
      };
      
      await this.scheduleLocalNotification(title, body, data);
    } catch (error) {
      console.error('Erro ao notificar evento favorito:', error);
    }
  }

  // Limpar todas as notificações
  async clearAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Todas as notificações foram canceladas');
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  }

  // Obter notificações agendadas
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Notificações agendadas:', notifications);
      return notifications;
    } catch (error) {
      console.error('Erro ao obter notificações agendadas:', error);
      return [];
    }
  }
}

export default new NotificationService();
