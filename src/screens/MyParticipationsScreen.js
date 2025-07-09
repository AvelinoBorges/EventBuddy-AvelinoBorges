import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {
  CalendarCheck,
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  Clock,
  Heart,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { eventService } from '../services/eventService';

const MyParticipationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { theme, isDarkMode } = useTheme();
  const [participationEvents, setParticipationEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  console.log('MyParticipationsScreen renderizando...', { user });

  // Opções de tipos para exibição das tags
  const eventTypes = [
    { id: 'all', label: 'Todos os tipos' },
    { id: 'concert', label: 'Concerto' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'conference', label: 'Conferência' },
    { id: 'sports', label: 'Esporte' },
    { id: 'cultural', label: 'Cultural' },
  ];

  useEffect(() => {
    loadParticipations();
  }, [user]);

  // Listener para atualizar quando volta à tela (ex: após se inscrever em um evento)
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      if (user) {
        loadParticipations();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const loadParticipations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar dados do usuário para obter lista de participações
      const userResult = await eventService.getUserData(user.uid);
      if (userResult.success && userResult.data.participations) {
        const participationIds = userResult.data.participations;
        
        if (participationIds.length > 0) {
          // Buscar todos os eventos
          const eventsResult = await eventService.getAllEvents();
          if (eventsResult.success) {
            // Filtrar apenas os eventos que o usuário participa
            const userEvents = eventsResult.data.filter(event =>
              participationIds.includes(event.id)
            );
            setParticipationEvents(userEvents);
          }
        } else {
          setParticipationEvents([]);
        }
      } else {
        setParticipationEvents([]);
      }
    } catch (error) {
      console.error('Erro ao carregar participações:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas participações');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParticipations();
    setRefreshing(false);
  };

  const handleCancelParticipation = async (eventId, eventTitle) => {
    Alert.alert(
      'Cancelar Participação',
      `Tem certeza que deseja cancelar sua participação no evento "${eventTitle}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await eventService.cancelParticipation(eventId, user.uid);
              if (result.success) {
                // Remover o evento da lista local
                setParticipationEvents(prev => 
                  prev.filter(event => event.id !== eventId)
                );
                Alert.alert('Sucesso', 'Participação cancelada com sucesso!');
              } else {
                Alert.alert('Erro', result.error || 'Não foi possível cancelar a participação');
              }
            } catch (error) {
              Alert.alert('Erro', 'Ocorreu um erro inesperado');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const renderParticipationCard = ({ item }) => {
    const isEventFavorite = isFavorite(item.id);
    const isPast = isEventPast(item.datetime);
    
    return (
      <TouchableOpacity
        style={[
          styles.eventCard, 
          { backgroundColor: theme.surface },
          theme.cardShadow,
          isPast && { opacity: 0.7 }
        ]}
        onPress={() => navigation.navigate('EventDetails', { event: item })}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[
          styles.statusBadge, 
          isPast 
            ? { backgroundColor: theme.textTertiary } 
            : { backgroundColor: theme.success }
        ]}>
          <Text style={[styles.statusText, { color: '#ffffff' }]}>
            {isPast ? 'Concluído' : 'Inscrito'}
          </Text>
        </View>

        {/* Conteúdo do card */}
        <View style={styles.eventContent}>
          <Text style={[
            styles.eventTitle, 
            { color: isPast ? theme.textTertiary : theme.text }
          ]} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={[
            styles.eventDescription, 
            { color: isPast ? theme.textTertiary : theme.textSecondary }
          ]} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Informações do evento */}
          <View style={styles.eventInfoContainer}>
            <View style={styles.eventInfoItem}>
              <Calendar size={16} color={isPast ? theme.textTertiary : theme.primary} />
              <Text style={[
                styles.eventInfoText, 
                { color: isPast ? theme.textTertiary : theme.textSecondary }
              ]}>
                {formatDate(item.datetime)}
              </Text>
            </View>

            <View style={styles.eventInfoItem}>
              <MapPin size={16} color={isPast ? theme.textTertiary : theme.primary} />
              <Text style={[
                styles.eventInfoText, 
                { color: isPast ? theme.textTertiary : theme.textSecondary }
              ]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>

            <View style={styles.eventInfoItem}>
              <Users size={16} color={isPast ? theme.textTertiary : theme.primary} />
              <Text style={[
                styles.eventInfoText, 
                { color: isPast ? theme.textTertiary : theme.textSecondary }
              ]}>
                {item.participants?.length || 0} participantes
              </Text>
              
              {/* Tag de categoria inline */}
              <View style={[
                styles.eventTypeTagInline, 
                { backgroundColor: isPast ? theme.textTertiary : theme.primary }
              ]}>
                <Text style={[styles.eventTypeTextInline, { color: '#ffffff' }]}>
                  {item.category || eventTypes.find(t => t.id === item.type)?.label || 'Evento'}
                </Text>
              </View>
            </View>
          </View>

          {/* Ações */}
          <View style={styles.eventActions}>
            <TouchableOpacity
              style={[
                styles.favoriteButton, 
                { backgroundColor: theme.borderLight },
                isEventFavorite && { backgroundColor: '#fee2e2' }
              ]}
              onPress={() => toggleFavorite(item)}
            >
              <Heart 
                size={18} 
                color={isEventFavorite ? "#ef4444" : theme.textSecondary} 
                fill={isEventFavorite ? "#ef4444" : "transparent"}
              />
              <Text style={[
                styles.favoriteButtonText, 
                { color: theme.textSecondary },
                isEventFavorite && { color: "#ef4444" }
              ]}>
                {isEventFavorite ? 'Favoritado' : 'Favoritar'}
              </Text>
            </TouchableOpacity>

            {!isPast && (
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#fee2e2' }]}
                onPress={() => handleCancelParticipation(item.id, item.title)}
              >
                <Text style={[styles.cancelButtonText, { color: '#dc2626' }]}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CalendarCheck size={64} color={theme.textTertiary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma participação encontrada</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Você ainda não está participando de nenhum evento. Explore eventos disponíveis e participe!
      </Text>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.exploreButtonText}>Explorar Eventos</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.headerStats, { backgroundColor: theme.surface }, theme.cardShadow]}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.text }]}>{participationEvents.length}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total de Participações</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {participationEvents.filter(event => !isEventPast(event.datetime)).length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Eventos Ativos</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {participationEvents.filter(event => isEventPast(event.datetime)).length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Concluídos</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.statusBarBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Minhas Participações</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={participationEvents}
        renderItem={renderParticipationCard}
        keyExtractor={(item) => item.id}
        style={styles.eventsList}
        contentContainerStyle={[
          styles.eventsListContent,
          participationEvents.length === 0 && styles.eventsListContentEmpty
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={participationEvents.length > 0 ? renderHeader : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventsListContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  eventCardPast: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1,
  },
  statusBadgeActive: {
    backgroundColor: '#22c55e',
  },
  statusBadgePast: {
    backgroundColor: '#94a3b8',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextPast: {
    color: '#ffffff',
  },
  eventContent: {
    marginTop: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 24,
    paddingRight: 80, // Espaço para o badge
  },
  eventTitlePast: {
    color: '#64748b',
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDescriptionPast: {
    color: '#94a3b8',
  },
  eventInfoContainer: {
    marginBottom: 16,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  eventInfoTextPast: {
    color: '#94a3b8',
  },
  eventTypeTagInline: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  eventTypeTagInlinePast: {
    backgroundColor: 'rgba(148, 163, 184, 0.9)',
  },
  eventTypeTextInline: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventTypeTextInlinePast: {
    color: '#ffffff',
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: '#667eea',
  },
  favoriteButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  favoriteButtonTextActive: {
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyParticipationsScreen;
