import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Dimensions,
  Alert,
  Image,
  Pressable,
  StatusBar,
} from 'react-native';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  List,
  Grid,
  Clock,
  X,
  ChevronDown,
  Heart,
} from 'lucide-react-native';
import { eventService } from '../services/eventService';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
// Importar listener em tempo real
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatCompactDate } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

const EventsScreen = ({ navigation }) => {
  // Context de favoritos e tema
  const { isFavorite, toggleFavorite } = useFavorites();
  const { theme, isDarkMode } = useTheme();
  
  // Estados principais
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados de UI
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detailed', ou 'grid'
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de filtros
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Opções de filtros
  const eventTypes = [
    { id: 'all', label: 'Todos os tipos' },
    { id: 'concert', label: 'Concerto' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'conference', label: 'Conferência' },
    { id: 'sports', label: 'Esporte' },
    { id: 'cultural', label: 'Cultural' },
  ];

  const dateFilters = [
    { id: 'all', label: 'Todas as datas' },
    { id: 'today', label: 'Hoje' },
    { id: 'upcoming', label: 'Próximos eventos' },
    { id: 'this_week', label: 'Esta semana' },
    { id: 'this_month', label: 'Este mês' },
  ];

  const locationFilters = [
    { id: 'all', label: 'Todas as localizações' },
    { id: 'lisboa', label: 'Lisboa' },
    { id: 'porto', label: 'Porto' },
    { id: 'coimbra', label: 'Coimbra' },
    { id: 'braga', label: 'Braga' },
  ];

  useEffect(() => {
    // Configurar listener em tempo real para atualizações automáticas
    setLoading(true);
    
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('datetime', 'asc')); // Ordem crescente para eventos próximos primeiro
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar eventos em tempo real:", error);
      setLoading(false);
      // Fallback para busca única
      fetchEventsFallback();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchText, selectedType, selectedDate, selectedLocation]);

  // Fallback para busca única quando listener falha
  const fetchEventsFallback = async () => {
    try {
      const result = await eventService.getAllEvents();
      if (result.success) {
        setEvents(result.data);
      } else {
        Alert.alert('Erro', result.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os eventos');
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result = await eventService.getAllEvents();
      if (result.success) {
        setEvents(result.data);
      } else {
        Alert.alert('Erro', result.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os eventos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filtro por texto de pesquisa
    if (searchText.trim()) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filtro por data
    if (selectedDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.datetime);
        
        switch (selectedDate) {
          case 'today':
            return eventDate.toDateString() === today.toDateString();
          case 'upcoming':
            return eventDate >= today;
          case 'this_week':
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            return eventDate >= today && eventDate <= weekEnd;
          case 'this_month':
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return eventDate >= today && eventDate <= monthEnd;
          default:
            return true;
        }
      });
    }

    // Filtro por localização
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(event =>
        event.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedDate('all');
    setSelectedLocation('all');
    setSearchText('');
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
          
          {/* Ícone de Favorito */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart 
              size={20} 
              color={isEventFavorite ? "#ef4444" : "#ffffff"} 
              fill={isEventFavorite ? "#ef4444" : "transparent"}
            />
          </TouchableOpacity>

          {/* Tag de tipo/categoria */}
          <View style={styles.eventTypeTag}>
            <Text style={styles.eventTypeText}>
              {item.category || eventTypes.find(t => t.id === item.type)?.label || 'Evento'}
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
                {formatCompactDate(item.datetime)}
              </Text>
            </View>

            <View style={styles.eventInfoItem}>
              <MapPin size={isGrid ? 14 : 16} color={theme.textTertiary} />
              <Text style={[styles.eventInfoText, { color: theme.textSecondary }, isGrid && styles.eventInfoTextGrid]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>

            {!isGrid && (
              <View style={styles.eventInfoItem}>
                <Users size={16} color={theme.textTertiary} />
                <Text style={[styles.eventInfoText, { color: theme.textSecondary }]}>
                  {item.participants?.length || 0} participantes
                </Text>
              </View>
            )}
          </View>

          {/* Botão de ação - apenas em modo detalhado */}
          {isDetailed && (
            <View style={styles.eventActionContainer}>
              <TouchableOpacity
                style={styles.eventActionButton}
                onPress={() => navigation.navigate('EventDetails', { event: item })}
              >
                <Text style={styles.eventActionText}>Ver detalhes</Text>
                <ArrowRight size={16} color="#475569" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          {/* Header do modal */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Filtros</Text>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Tipo de evento</Text>
            <View style={styles.filterOptions}>
              {eventTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.filterOption,
                    { backgroundColor: theme.borderLight, borderColor: theme.border },
                    selectedType === type.id && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: theme.text },
                    selectedType === type.id && { color: '#ffffff' }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Data</Text>
            <View style={styles.filterOptions}>
              {dateFilters.map(date => (
                <TouchableOpacity
                  key={date.id}
                  style={[
                    styles.filterOption,
                    { backgroundColor: theme.borderLight, borderColor: theme.border },
                    selectedDate === date.id && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setSelectedDate(date.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: theme.text },
                    selectedDate === date.id && { color: '#ffffff' }
                  ]}>
                    {date.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Localização</Text>
            <View style={styles.filterOptions}>
              {locationFilters.map(location => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.filterOption,
                    { backgroundColor: theme.borderLight, borderColor: theme.border },
                    selectedLocation === location.id && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setSelectedLocation(location.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: theme.text },
                    selectedLocation === location.id && { color: '#ffffff' }
                  ]}>
                    {location.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botões de ação */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.clearFiltersButton, { backgroundColor: theme.borderLight, borderColor: theme.border }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearFiltersText, { color: theme.textSecondary }]}>Limpar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyFiltersButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Calendar size={64} color="#94a3b8" />
      <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {searchText || selectedType !== 'all' || selectedDate !== 'all' || selectedLocation !== 'all'
          ? 'Tente ajustar os filtros ou pesquisa'
          : 'Não há eventos disponíveis no momento'
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.statusBarBackground} />
      
      {/* Header com pesquisa e controles */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Eventos</Text>
        
        {/* Barra de pesquisa */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Search size={20} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Pesquisar eventos..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={theme.placeholder}
            />
          </View>
        </View>

        {/* Controles */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.borderLight }]}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={20} color={theme.primary} />
            <Text style={[styles.filterButtonText, { color: theme.primary }]}>Filtros</Text>
          </TouchableOpacity>

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
              <Grid size={18} color={viewMode === 'grid' ? '#fff' : '#667eea'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'detailed' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('detailed')}
            >
              <Calendar size={18} color={viewMode === 'detailed' ? '#fff' : '#667eea'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Lista de eventos */}
      <FlatList
        data={filteredEvents}
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

      {/* Modal de filtros */}
      {renderFilterModal()}
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    marginLeft: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalCloseButton: {
    padding: 8,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  clearFiltersText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyFiltersText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsScreen;
