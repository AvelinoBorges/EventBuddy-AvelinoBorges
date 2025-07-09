import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Users,
  Heart,
  Share,
  Clock,
  ChevronRight,
  Bell,
  BellRing,
} from 'lucide-react-native';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { eventService } from '../services/eventService';
import { formatDetailedDate } from '../utils/dateUtils';
import { getPriceLabel, getPriceValue } from '../utils/priceUtils';
import { openQuickDirections } from '../utils/mapsUtils';

const { width } = Dimensions.get('window');

const EventDetailsScreen = ({ navigation, route }) => {
  const { event } = route.params;
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { scheduleEventReminder, cancelEventReminders, permissionGranted } = useNotifications();
  const [isParticipating, setIsParticipating] = useState(false);
  const [participantCount, setParticipantCount] = useState(event.participants?.length || 0);
  const [loading, setLoading] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  
  // Context de favoritos
  const { isFavorite, toggleFavorite } = useFavorites();
  const isEventFavorite = isFavorite(event.id);

  // Verificar se o usuário já está participando do evento
  useEffect(() => {
    if (user && event.participants) {
      setIsParticipating(event.participants.includes(user.uid));
    }
  }, [user, event.participants]);

  // Verificar participação no Firestore ao carregar a tela
  useEffect(() => {
    checkUserParticipation();
  }, [user]);

  const checkUserParticipation = async () => {
    if (!user) return;
    
    try {
      const userResult = await eventService.getUserData(user.uid);
      if (userResult.success && userResult.data.participations) {
        const isUserParticipating = userResult.data.participations.includes(event.id);
        setIsParticipating(isUserParticipating);
      }
    } catch (error) {
      console.error('Erro ao verificar participação:', error);
    }
  };

  const handleParticipate = async () => {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para participar de eventos');
      return;
    }

    setLoading(true);

    if (isParticipating) {
      // Cancelar participação
      Alert.alert(
        'Cancelar participação',
        'Tem certeza que deseja cancelar sua participação neste evento?',
        [
          { text: 'Não', style: 'cancel', onPress: () => setLoading(false) },
          { 
            text: 'Sim', 
            onPress: async () => {
              try {
                const result = await eventService.cancelParticipation(event.id, user.uid);
                if (result.success) {
                  setIsParticipating(false);
                  setParticipantCount(prev => Math.max(0, prev - 1));
                  Alert.alert('Sucesso', 'Participação cancelada com sucesso!');
                } else {
                  Alert.alert('Erro', result.error || 'Não foi possível cancelar a participação');
                }
              } catch (error) {
                Alert.alert('Erro', 'Ocorreu um erro inesperado');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } else {
      // Participar no evento
      try {
        const result = await eventService.participateInEvent(event.id, user.uid);
        if (result.success) {
          setIsParticipating(true);
          setParticipantCount(prev => prev + 1);
          Alert.alert('Sucesso', 'Inscrição realizada com sucesso! Você pode ver suas participações no seu perfil.');
        } else {
          Alert.alert('Erro', result.error || 'Não foi possível realizar a inscrição');
        }
      } catch (error) {
        Alert.alert('Erro', 'Ocorreu um erro inesperado');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReminder = async () => {
    if (!permissionGranted) {
      Alert.alert(
        'Permissão Necessária',
        'Para receber lembretes, é necessário permitir notificações.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user) {
      Alert.alert('Login necessário', 'Faça login para agendar lembretes');
      return;
    }

    if (hasReminder) {
      // Cancelar lembrete
      Alert.alert(
        'Cancelar Lembrete',
        'Deseja cancelar o lembrete deste evento?',
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim', onPress: async () => {
            try {
              await cancelEventReminders(event.id);
              setHasReminder(false);
              Alert.alert('Sucesso', 'Lembrete cancelado com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar o lembrete');
            }
          }}
        ]
      );
    } else {
      // Agendar lembrete
      try {
        const notificationId = await scheduleEventReminder(event);
        if (notificationId) {
          setHasReminder(true);
          Alert.alert('Sucesso', 'Lembrete agendado com sucesso! Você será notificado antes do evento começar.');
        } else {
          Alert.alert('Erro', 'Não foi possível agendar o lembrete');
        }
      } catch (error) {
        Alert.alert('Erro', 'Ocorreu um erro ao agendar o lembrete');
      }
    }
  };

  const handleShare = () => {
    Alert.alert('Compartilhar', 'Funcionalidade de compartilhamento em desenvolvimento');
  };

  const handleLocationPress = () => {
    // Mostrar opções de localização
    Alert.alert(
      '📍 Localização do Evento',
      `${event.title}\n${event.location}`,
      [
        {
          text: '🗺️ Ver no Mapa',
          onPress: () => {
            // Navegar para o mapa com o evento selecionado
            navigation.navigate('Map', {
              screen: 'MapList',
              params: {
                selectedEvent: event,
                focusOnEvent: true
              }
            });
          }
        },
        {
          text: '🧭 Obter Direções',
          onPress: async () => {
            await openQuickDirections({
              latitude: event.latitude,
              longitude: event.longitude,
              title: event.title,
              address: event.location
            });
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  };

  const eventTypes = {
    concert: 'Concerto',
    workshop: 'Workshop',
    conference: 'Conferência',
    sports: 'Esporte',
    cultural: 'Cultural',
  };

  const { date, time } = formatDetailedDate(event.datetime);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com imagem */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.imageUrl || 'https://via.placeholder.com/400x250?text=Evento' }}
            style={styles.eventImage}
            resizeMode="cover"
          />
          
          {/* Overlay com controles */}
          <View style={styles.imageOverlay}>
            {/* Botão voltar */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Ícones de ação */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Share size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReminder}
              >
                {hasReminder ? (
                  <BellRing size={20} color="#fbbf24" />
                ) : (
                  <Bell size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleFavorite(event)}
              >
                <Heart 
                  size={20} 
                  color={isEventFavorite ? "#ef4444" : "#ffffff"} 
                  fill={isEventFavorite ? "#ef4444" : "transparent"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tag de categoria/tipo */}
          <View style={[styles.eventTypeTag, { backgroundColor: theme.primary }]}>
            <Text style={styles.eventTypeText}>
              {event.category || eventTypes[event.type] || 'Evento'}
            </Text>
          </View>
        </View>

        {/* Conteúdo principal */}
        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
          {/* Título */}
          <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>

          {/* Card de informações principais */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
            {/* Data e hora */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.borderLight }]}>
                <Calendar size={20} color={theme.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Data e hora</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{date}</Text>
                <Text style={[styles.infoSubValue, { color: theme.textSecondary }]}>{time}</Text>
              </View>
            </View>

            {/* Localização */}
            <TouchableOpacity 
              style={styles.infoItemClickable}
              onPress={() => handleLocationPress()}
              activeOpacity={0.7}
            >
              <View style={[styles.infoIconContainer, { backgroundColor: theme.borderLight }]}>
                <MapPin size={20} color={theme.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Localização</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{event.location}</Text>
                <Text style={[styles.infoSubValue, { color: theme.primary }]}>Toque para opções de navegação</Text>
              </View>
              <View style={styles.infoAction}>
                <ChevronRight size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>

            {/* Organizador */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.borderLight }]}>
                <User size={20} color={theme.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Organizador</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{event.organizer || 'Event Buddy'}</Text>
              </View>
            </View>

            {/* Participantes */}
            <View style={[styles.infoItem, styles.lastInfoItem]}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.borderLight }]}>
                <Users size={20} color={theme.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Participantes</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {participantCount} inscritos
                </Text>
                {event.capacity && (
                  <Text style={[styles.infoSubValue, { color: theme.textSecondary }]}>
                    Capacidade: {event.capacity} pessoas
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Descrição */}
          <View style={[styles.descriptionCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <Text style={[styles.descriptionTitle, { color: theme.text }]}>Sobre o evento</Text>
            <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
              {event.description || 'Junte-se a nós neste evento incrível! Uma experiência única que você não pode perder. Venha fazer parte de momentos especiais e criar memórias inesquecíveis junto com outras pessoas que compartilham dos mesmos interesses.'}
            </Text>
          </View>

          {/* Informações adicionais */}
          {event.requirements && (
            <View style={[styles.requirementsCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <Text style={[styles.requirementsTitle, { color: theme.text }]}>Requisitos</Text>
              <Text style={[styles.requirementsText, { color: theme.textSecondary }]}>{event.requirements}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botão de ação fixo */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
            {getPriceLabel(event.price)}
          </Text>
          {getPriceValue(event.price) && (
            <Text style={[styles.priceValue, { color: theme.text }]}>{getPriceValue(event.price)}</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.participateButton,
            { backgroundColor: theme.primary },
            isParticipating && { backgroundColor: theme.success },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleParticipate}
          disabled={loading}
        >
          <Text style={[
            styles.participateButtonText,
            { color: '#ffffff' }
          ]}>
            {loading ? 'Processando...' : (isParticipating ? 'Inscrito ✓' : 'Participar')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espaço para o botão fixo
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#e2e8f0',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTypeTag: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eventTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 28,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 24,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1e293b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoItemClickable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: -4,
  },
  lastInfoItem: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
    lineHeight: 22,
  },
  infoSubValue: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoAction: {
    alignSelf: 'center',
    marginLeft: 12,
  },
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1e293b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  requirementsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1e293b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  requirementsText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  priceContainer: {
    flex: 1,
    marginRight: 16,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#667eea',
    letterSpacing: -0.5,
  },
  participateButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  participateButtonActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  participateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  participateButtonTextActive: {
    color: '#ffffff',
  },
  participateButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
    opacity: 0.7,
  },
});

export default EventDetailsScreen;
