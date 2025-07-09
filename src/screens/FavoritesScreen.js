import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
  Pressable,
} from 'react-native';
import {
  Heart,
  Calendar,
  MapPin,
  ArrowRight,
  List,
  Grid,
  BookmarkX,
} from 'lucide-react-native';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const FavoritesScreen = ({ navigation }) => {
  // Context de favoritos e tema
  const { 
    favoriteEvents, 
    loading, 
    isFavorite, 
    toggleFavorite, 
    refreshFavoriteEvents 
  } = useFavorites();
  const { theme, isDarkMode } = useTheme();

  // Estados de UI
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detailed', ou 'grid'

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFavoriteEvents();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const eventTypes = {
    concert: 'Concerto',
    workshop: 'Workshop',
    conference: 'Conferência',
    sports: 'Esporte',
    cultural: 'Cultural',
  };

  const renderEventCard = ({ item }) => {
    const isDetailed = viewMode === 'detailed';
    const isGrid = viewMode === 'grid';
    const isEventFavorite = isFavorite(item.id);
    
    return (
      <Pressable
        style={[
          styles.eventCard, 
          { backgroundColor: theme.surface },
          theme.cardShadow,
          isDetailed && styles.eventCardDetailed,
          isGrid && styles.eventCardGrid
        ]}
        onPress={() => navigation.navigate('EventDetails', { event: item })}
        android_ripple={{ color: theme.overlay }}
      >
        {/* Imagem do evento */}
        <View style={[
          styles.eventImageContainer, 
          isDetailed && styles.eventImageContainerDetailed,
          isGrid && styles.eventImageContainerGrid
        ]}>
          <Image
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/300x200?text=Evento' }}
            style={[
              styles.eventImage, 
              isDetailed && styles.eventImageDetailed,
              isGrid && styles.eventImageGrid
            ]}
            resizeMode="cover"
          />
          
          {/* Ícone de Favorito - sempre ativo na tela de favoritos */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart 
              size={20} 
              color="#ef4444" 
              fill="#ef4444"
            />
          </TouchableOpacity>

          {/* Tag de categoria/tipo */}
          <View style={styles.eventTypeTag}>
            <Text style={styles.eventTypeText}>
              {item.category || eventTypes[item.type] || 'Evento'}
            </Text>
          </View>
        </View>

        {/* Conteúdo do card */}
        <View style={[
          styles.eventContent, 
          isDetailed && styles.eventContentDetailed,
          isGrid && styles.eventContentGrid
        ]}>
          <Text style={[
            styles.eventTitle, 
            { color: theme.text },
            isDetailed && styles.eventTitleDetailed,
            isGrid && styles.eventTitleGrid
          ]} numberOfLines={isGrid ? 2 : (isDetailed ? 3 : 2)}>
            {item.title}
          </Text>

          {isDetailed && (
            <Text style={[styles.eventDescription, { color: theme.textSecondary }]} numberOfLines={3}>
              {item.description}
            </Text>
          )}

          {/* Informações do evento */}
          <View style={[styles.eventInfoContainer, isGrid && styles.eventInfoContainerGrid]}>
            <View style={styles.eventInfoItem}>
              <Calendar size={isGrid ? 14 : 16} color={theme.textTertiary} />
              <Text style={[styles.eventInfoText, { color: theme.textSecondary }, isGrid && styles.eventInfoTextGrid]}>
                {formatDate(item.datetime)}
              </Text>
            </View>

            <View style={styles.eventInfoItem}>
              <MapPin size={isGrid ? 14 : 16} color={theme.textTertiary} />
              <Text style={[styles.eventInfoText, { color: theme.textSecondary }, isGrid && styles.eventInfoTextGrid]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          </View>

          {/* Botão de ação - apenas em modo detalhado */}
          {isDetailed && (
            <View style={styles.eventActionContainer}>
              <TouchableOpacity
                style={[styles.eventActionButton, { backgroundColor: theme.borderLight }]}
                onPress={() => navigation.navigate('EventDetails', { event: item })}
              >
                <Text style={[styles.eventActionText, { color: theme.textSecondary }]}>Ver detalhes</Text>
                <ArrowRight size={16} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <BookmarkX size={64} color={theme.textTertiary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum evento favorito</Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Ainda não há eventos salvos nos seus favoritos.{'\n'}
        Explore eventos e marque os que mais gosta!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.statusBarBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTitleContainer}>
          <Heart size={28} color="#ef4444" fill="#ef4444" />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Favoritos</Text>
        </View>
        
        {favoriteEvents.length > 0 && (
          <View style={styles.controlsContainer}>
            <View style={[styles.viewToggle, { backgroundColor: theme.borderLight }]}>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === 'list' && { backgroundColor: theme.primary }]}
                onPress={() => setViewMode('list')}
              >
                <List size={18} color={viewMode === 'list' ? '#fff' : theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === 'grid' && { backgroundColor: theme.primary }]}
                onPress={() => setViewMode('grid')}
              >
                <Grid size={18} color={viewMode === 'grid' ? '#fff' : theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === 'detailed' && { backgroundColor: theme.primary }]}
                onPress={() => setViewMode('detailed')}
              >
                <Calendar size={18} color={viewMode === 'detailed' ? '#fff' : theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Lista de eventos favoritos */}
      <FlatList
        data={favoriteEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderEmptyState}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Força re-render quando muda o modo de visualização
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
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
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#667eea',
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 24,
    paddingTop: 20,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    marginHorizontal: 4,
    shadowColor: '#1e293b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  eventCardDetailed: {
    marginBottom: 28,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  eventCardGrid: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  eventImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#f8fafc',
  },
  eventImageContainerDetailed: {
    height: 200,
  },
  eventImageContainerGrid: {
    height: 120,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  eventImageDetailed: {
    height: 200,
  },
  eventImageGrid: {
    height: 120,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  eventTypeTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  eventTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eventContent: {
    padding: 20,
    paddingTop: 24,
  },
  eventContentDetailed: {
    padding: 24,
    paddingTop: 28,
  },
  eventContentGrid: {
    padding: 16,
    paddingTop: 18,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  eventTitleDetailed: {
    fontSize: 22,
    marginBottom: 16,
    lineHeight: 28,
  },
  eventTitleGrid: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 20,
  },
  eventDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  eventInfoContainer: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  eventInfoContainerGrid: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 2,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  eventInfoTextGrid: {
    fontSize: 12,
    marginLeft: 8,
  },
  eventActionContainer: {
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  eventActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventActionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
});

export default FavoritesScreen;
