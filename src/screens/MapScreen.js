import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  FlatList,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import SuperCluster from 'supercluster';
import { 
  MapPin, 
  Navigation, 
  Filter,
  Calendar,
  Clock,
  Users,
  Search,
  X,
  ChevronDown,
  Music,
  Code,
  Utensils,
  Palette,
  Briefcase,
  GraduationCap,
  Heart,
  Activity,
  ExternalLink
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { openQuickDirections } from '../utils/mapsUtils';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Parâmetros da navegação
  const navigationSelectedEvent = route.params?.selectedEvent;
  const focusOnEvent = route.params?.focusOnEvent;
  const mapRef = useRef(null);
  
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Estados para filtros e busca
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Estados para clustering
  const [mapRegion, setMapRegion] = useState(null);
  const [clusters, setClusters] = useState([]);

  // Categorias disponíveis
  const categories = [
    { id: 'música', name: 'Música', icon: Music, color: '#ef4444' },
    { id: 'tecnologia', name: 'Tecnologia', icon: Code, color: '#3b82f6' },
    { id: 'esportes', name: 'Esportes', icon: Activity, color: '#10b981' },
    { id: 'arte', name: 'Arte', icon: Palette, color: '#f59e0b' },
    { id: 'gastronomia', name: 'Gastronomia', icon: Utensils, color: '#8b5cf6' },
    { id: 'educação', name: 'Educação', icon: GraduationCap, color: '#06b6d4' },
    { id: 'negócios', name: 'Negócios', icon: Briefcase, color: '#6366f1' },
    { id: 'saúde', name: 'Saúde', icon: Heart, color: '#84cc16' },
  ];

  // Configuração do SuperCluster
  const superCluster = useMemo(() => {
    return new SuperCluster({
      radius: 60,
      maxZoom: 15,
      minZoom: 3,
      minPoints: 2,
    });
  }, []);

  // Região padrão (Lisboa, Portugal)
  const defaultRegion = {
    latitude: 38.7223,
    longitude: -9.1393,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  useEffect(() => {
    requestLocationPermission();
    loadEvents();
  }, []);

  // Efeito para filtrar eventos
  useEffect(() => {
    applyFilters();
  }, [events, selectedCategories, searchQuery]);

  // Efeito para atualizar clusters
  useEffect(() => {
    if (filteredEvents.length > 0 && mapRegion) {
      updateClusters();
    }
  }, [filteredEvents, mapRegion]);

  // Efeito para focar no evento quando navegado dos detalhes
  useEffect(() => {
    if (navigationSelectedEvent && focusOnEvent && mapRef.current) {
      // Definir o evento selecionado
      setSelectedEvent(navigationSelectedEvent);
      
      // Focar no evento no mapa
      if (navigationSelectedEvent.latitude && navigationSelectedEvent.longitude) {
        const eventLocation = {
          latitude: navigationSelectedEvent.latitude,
          longitude: navigationSelectedEvent.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        mapRef.current.animateToRegion(eventLocation, 1000);
      }
    }
  }, [navigationSelectedEvent, focusOnEvent, mapReady]);

  const applyFilters = () => {
    let filtered = [...events];

    // Filtro por categoria
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => 
        selectedCategories.includes(event.category?.toLowerCase())
      );
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.organizer?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const updateClusters = () => {
    if (!mapRegion || filteredEvents.length === 0) {
      setClusters([]);
      return;
    }

    // Preparar dados para o SuperCluster
    const points = filteredEvents.map(event => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [event.longitude, event.latitude],
      },
      properties: {
        cluster: false,
        eventId: event.id,
        event: event,
      },
    }));

    superCluster.load(points);

    // Calcular zoom level baseado na região
    const zoom = Math.round(Math.log(360 / mapRegion.longitudeDelta) / Math.LN2);
    
    // Obter clusters para a região atual
    const bbox = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2,
      mapRegion.latitude - mapRegion.latitudeDelta / 2,
      mapRegion.longitude + mapRegion.longitudeDelta / 2,
      mapRegion.latitude + mapRegion.latitudeDelta / 2,
    ];

    const clusterData = superCluster.getClusters(bbox, zoom);
    setClusters(clusterData);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        setLoading(false);
        Alert.alert(
          'Permissão de Localização',
          'Para uma melhor experiência, permita o acesso à sua localização para ver eventos próximos.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de localização:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      setLocation(userLocation);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      console.log('🔍 Carregando eventos do Firebase...');
      const result = await eventService.getAllEvents();
      console.log('📊 Resultado do Firebase:', result);
      
      if (result.success) {
        console.log(`📍 Total de eventos encontrados: ${result.data.length}`);
        
        // Filtrar apenas eventos que têm coordenadas
        const eventsWithLocation = result.data.filter(event => 
          event.latitude && event.longitude
        );
        
        console.log(`🗺️ Eventos com coordenadas: ${eventsWithLocation.length}`);
        eventsWithLocation.forEach(event => {
          console.log(`📌 ${event.title} - ${event.latitude}, ${event.longitude}`);
        });
        
        // Se não há eventos no Firebase, adicionar eventos de teste temporários
        if (eventsWithLocation.length === 0) {
          console.log('📍 Nenhum evento encontrado no Firebase. Adicionando eventos de teste...');
          const testEvents = [
            {
              id: 'test1',
              title: "Festival de Música de Verão",
              description: "Um incrível festival de música ao ar livre com artistas nacionais e internacionais.",
              location: "Parque da Cidade, Lisboa",
              latitude: 38.7589,
              longitude: -9.1507,
              date: "2025-07-15",
              time: "18:00",
              datetime: new Date("2025-07-15T18:00:00.000Z"),
              imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
              type: "cultural",
              category: "música",
              participants: [],
              price: "Gratuito",
              organizer: "Câmara Municipal de Lisboa"
            },
            {
              id: 'test2',
              title: "Workshop de Programação React Native",
              description: "Aprenda a desenvolver aplicações móveis com React Native neste workshop prático.",
              location: "Centro de Inovação, Porto",
              latitude: 41.1579,
              longitude: -8.6291,
              date: "2025-08-10",
              time: "09:00",
              datetime: new Date("2025-08-10T09:00:00.000Z"),
              imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800",
              type: "workshop",
              category: "tecnologia",
              participants: [],
              price: "€50",
              organizer: "TechHub Porto"
            },
            {
              id: 'test3',
              title: "Feira Gastronômica Internacional",
              description: "Experimente sabores de todo o mundo nesta feira gastronômica especial.",
              location: "Praça do Comércio, Lisboa",
              latitude: 38.7071,
              longitude: -9.1364,
              date: "2025-07-25",
              time: "11:00",
              datetime: new Date("2025-07-25T11:00:00.000Z"),
              imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
              type: "cultural",
              category: "gastronomia",
              participants: [],
              price: "Gratuito",
              organizer: "Turismo de Lisboa"
            }
          ];
          setEvents(testEvents);
          console.log('🎯 Eventos de teste adicionados para visualização no mapa');
        } else {
          setEvents(eventsWithLocation);
        }
      } else {
        console.error('❌ Erro ao carregar eventos:', result.error);
        // Se houver erro no Firebase, ainda mostrar eventos de teste
        console.log('📍 Erro no Firebase. Carregando eventos de teste...');
        const testEvents = [
          {
            id: 'test1',
            title: "Festival de Música de Verão",
            description: "Um incrível festival de música ao ar livre com artistas nacionais e internacionais.",
            location: "Parque da Cidade, Lisboa",
            latitude: 38.7589,
            longitude: -9.1507,
            date: "2025-07-15",
            time: "18:00",
            datetime: new Date("2025-07-15T18:00:00.000Z"),
            imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
            type: "cultural",
            category: "música",
            participants: [],
            price: "Gratuito",
            organizer: "Câmara Municipal de Lisboa"
          },
          {
            id: 'test2',
            title: "Workshop de Programação React Native",
            description: "Aprenda a desenvolver aplicações móveis com React Native neste workshop prático.",
            location: "Centro de Inovação, Porto",
            latitude: 41.1579,
            longitude: -8.6291,
            date: "2025-08-10",
            time: "09:00",
            datetime: new Date("2025-08-10T09:00:00.000Z"),
            imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800",
            type: "workshop",
            category: "tecnologia",
            participants: [],
            price: "€50",
            organizer: "TechHub Porto"
          }
        ];
        setEvents(testEvents);
        console.log('🎯 Eventos de teste adicionados devido a erro no Firebase');
      }
    } catch (error) {
      console.error('❌ Erro na função loadEvents:', error);
      // Se houver erro completo, ainda mostrar eventos de teste
      console.log('📍 Erro crítico. Carregando eventos de teste como fallback...');
      const testEvents = [
        {
          id: 'test1',
          title: "Festival de Música de Verão",
          description: "Um incrível festival de música ao ar livre com artistas nacionais e internacionais.",
          location: "Parque da Cidade, Lisboa",
          latitude: 38.7589,
          longitude: -9.1507,
          date: "2025-07-15",
          time: "18:00",
          datetime: new Date("2025-07-15T18:00:00.000Z"),
          imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
          type: "cultural",
          category: "música",
          participants: [],
          price: "Gratuito",
          organizer: "Câmara Municipal de Lisboa"
        }
      ];
      setEvents(testEvents);
      console.log('🎯 Evento de teste básico adicionado como fallback final');
    }
  };

  const onRegionChangeComplete = (region) => {
    setMapRegion(region);
  };

  const onMarkerPress = (event) => {
    setSelectedEvent(event);
    
    // Animar para o evento selecionado
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: event.latitude,
        longitude: event.longitude,
        latitudeDelta: LATITUDE_DELTA * 0.5,
        longitudeDelta: LONGITUDE_DELTA * 0.5,
      }, 1000);
    }
  };

  // Estado para controlar cliques duplos em clusters
  const [lastClusterClick, setLastClusterClick] = useState(null);
  const [clusterClickTimeout, setClusterClickTimeout] = useState(null);

  const onClusterPress = (cluster) => {
    const clusterCoordinates = cluster.geometry.coordinates;
    const clusterId = cluster.properties.cluster_id;
    const zoom = Math.round(Math.log(360 / mapRegion.longitudeDelta) / Math.LN2);
    const clusterEvents = superCluster.getLeaves(clusterId, Infinity).map(e => e.properties.event);

    // Se só há um evento, tratar como clique em marcador
    if (clusterEvents.length === 1) {
      onMarkerPress(clusterEvents[0]);
      return;
    }

    // Verificar se é um clique duplo no mesmo cluster
    const now = Date.now();
    const isDoubleClick = lastClusterClick && 
                         lastClusterClick.clusterId === clusterId && 
                         (now - lastClusterClick.timestamp) < 500;
    if (isDoubleClick || zoom >= 15) {
      if (clusterClickTimeout) {
        clearTimeout(clusterClickTimeout);
        setClusterClickTimeout(null);
      }
      showClusterEvents(clusterEvents);
      setLastClusterClick(null);
    } else {
      setLastClusterClick({ clusterId, timestamp: now });
      const eventCount = clusterEvents.length;
      const zoomFactor = eventCount <= 3 ? 4 : eventCount <= 10 ? 3 : 2;
      mapRef.current?.animateToRegion({
        latitude: clusterCoordinates[1],
        longitude: clusterCoordinates[0],
        latitudeDelta: mapRegion.latitudeDelta / zoomFactor,
        longitudeDelta: mapRegion.longitudeDelta / zoomFactor,
      }, 500);
      if (Platform.OS === 'android') {
        Alert.alert(
          '', 
          '👆 Toque novamente para ver os eventos', 
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }
      const timeout = setTimeout(() => {
        showClusterEvents(clusterEvents);
        setLastClusterClick(null);
      }, 1500);
      setClusterClickTimeout(timeout);
    }
  };

  let lastClusterPopupTime = 0;

  const showClusterEvents = (clusterEvents) => {
    const now = Date.now();
    if (now - lastClusterPopupTime < 500) return; // Prevent duplicate popups within 500ms
    lastClusterPopupTime = now;
    
    if (clusterEvents.length === 1) {
      // Se há apenas um evento, mostrar diretamente
      setSelectedEvent(clusterEvents[0]);
      return;
    }
    
    // Preparar lista de eventos para o popup
    const eventList = clusterEvents.slice(0, 5).map(event => ({
      title: event.title,
      onPress: () => setSelectedEvent(event)
    }));
    
    // Adicionar opção "Ver todos" se há mais de 5 eventos
    if (clusterEvents.length > 5) {
      eventList.push({
        title: `Ver todos os ${clusterEvents.length} eventos`,
        onPress: () => {
          // Navegar para lista de eventos filtrados por esta área
          navigation.navigate('Eventos', { 
            prefilterEvents: clusterEvents,
            title: `${clusterEvents.length} eventos nesta área`
          });
        }
      });
    }
    
    Alert.alert(
      '📍 Eventos nesta área',
      clusterEvents.length === 1 
        ? `${clusterEvents[0].title}` 
        : `${clusterEvents.length} eventos encontrados`,
      [
        { text: 'Fechar', style: 'cancel' },
        ...eventList.map(item => ({
          text: item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title,
          onPress: item.onPress
        }))
      ]
    );
  };

  const toggleCategoryFilter = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setShowFilters(false);
    setShowSearch(false);
  };

  const getMarkerColor = (category) => {
    const categoryConfig = categories.find(cat => cat.id === category?.toLowerCase());
    return categoryConfig?.color || theme.primary;
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || MapPin;
  };

  const centerOnUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(location, 1000);
    } else if (!locationPermission) {
      Alert.alert(
        'Localização não disponível',
        'Permita o acesso à localização para usar esta funcionalidade.',
        [{ text: 'OK' }]
      );
    }
  };

  const centerMapOnEvents = () => {
    if (filteredEvents.length === 0 || !mapRef.current) return;
    
    // Encontrar os limites (min/max latitude e longitude) de todos os eventos filtrados
    let minLat = filteredEvents[0].latitude;
    let maxLat = filteredEvents[0].latitude;
    let minLng = filteredEvents[0].longitude;
    let maxLng = filteredEvents[0].longitude;
    
    filteredEvents.forEach(event => {
      minLat = Math.min(minLat, event.latitude);
      maxLat = Math.max(maxLat, event.latitude);
      minLng = Math.min(minLng, event.longitude);
      maxLng = Math.max(maxLng, event.longitude);
    });
    
    // Adicionar um padding aos limites para melhor visualização
    const paddingFactor = 0.2; // 20% de padding
    const latDelta = (maxLat - minLat) * (1 + paddingFactor);
    const lngDelta = (maxLng - minLng) * (1 + paddingFactor);
    
    // Centralizar o mapa na região que contém todos os eventos
    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.02), // Evitar zoom excessivo
      longitudeDelta: Math.max(lngDelta, 0.02),
    }, 1000);
  };

  const goToEventDetails = () => {
    if (selectedEvent) {
      navigation.navigate('EventDetails', { 
        eventId: selectedEvent.id,
        event: selectedEvent 
      });
    }
  };

  const openExternalMaps = async () => {
    if (!selectedEvent) {
      Alert.alert('Erro', 'Nenhum evento selecionado');
      return;
    }

    await openQuickDirections({
      latitude: selectedEvent.latitude,
      longitude: selectedEvent.longitude,
      title: selectedEvent.title,
      address: selectedEvent.location
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getFilterCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.statusBarBackground} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Carregando mapa...
        </Text>
      </View>
    );
  }

  const mapStyle = isDarkMode ? [
    {
      "elementType": "geometry",
      "stylers": [{"color": "#242f3e"}]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#746855"}]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{"color": "#242f3e"}]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#d59563"}]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#d59563"}]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{"color": "#263c3f"}]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#6b9a76"}]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{"color": "#38414e"}]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{"color": "#212a37"}]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#9ca5b3"}]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{"color": "#746855"}]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{"color": "#1f2835"}]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#f3d19c"}]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [{"color": "#2f3948"}]
    },
    {
      "featureType": "transit.station",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#d59563"}]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{"color": "#17263c"}]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#515c6d"}]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [{"color": "#17263c"}]
    }
  ] : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.statusBarBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <MapPin size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Mapa de Eventos</Text>
        </View>
        
        {/* Barra de busca */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <Search size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchText, { color: theme.inputText }]}
                placeholder="Buscar eventos..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={location || defaultRegion}
          customMapStyle={mapStyle}
          showsUserLocation={locationPermission}
          showsMyLocationButton={false}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {/* Renderizar clusters e marcadores */}
          {clusters.map((cluster, index) => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            
            if (cluster.properties.cluster) {
              // Verificar se este cluster foi clicado recentemente
              const isRecentlyClicked = lastClusterClick && 
                                       lastClusterClick.clusterId === cluster.properties.cluster_id;
              
              // Renderizar cluster
              return (
                <Marker
                  key={`cluster-${index}`}
                  coordinate={{ latitude, longitude }}
                  onPress={() => onClusterPress(cluster)}
                >
                  <View style={[
                    styles.clusterMarker, 
                    { backgroundColor: theme.primary },
                    isRecentlyClicked && styles.clusterMarkerActive
                  ]}>
                    <Text style={[
                      styles.clusterText,
                      isRecentlyClicked && styles.clusterTextActive
                    ]}>
                      {cluster.properties.point_count}
                    </Text>
                    {isRecentlyClicked && (
                      <View style={styles.clusterPulse}>
                        <Text style={styles.clusterHint}>👆</Text>
                      </View>
                    )}
                  </View>
                </Marker>
              );
            } else {
              // Renderizar marcador individual
              const event = cluster.properties.event;
              return (
                <Marker
                  key={event.id}
                  coordinate={{
                    latitude: event.latitude,
                    longitude: event.longitude,
                  }}
                  onPress={() => onMarkerPress(event)}
                  pinColor={getMarkerColor(event.category)}
                />
              );
            }
          })}
        </MapView>

        {/* Botões de controle */}
        <View style={styles.controlsContainer}>
          {/* Botão de busca */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.surface }, showSearch && { backgroundColor: theme.primary }]}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={24} color={showSearch ? '#ffffff' : theme.primary} />
          </TouchableOpacity>

          {/* Botão de filtros */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.surface }, getFilterCount() > 0 && { backgroundColor: theme.primary }]}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={24} color={getFilterCount() > 0 ? '#ffffff' : theme.primary} />
            {getFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Botão de localização */}
          {locationPermission && (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.surface }]}
              onPress={centerOnUserLocation}
            >
              <Navigation size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Card do evento selecionado */}
      {selectedEvent && (
        <View style={[styles.eventCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={styles.eventCardHeader}>
            <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={2}>
              {selectedEvent.title}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}
            >
              <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.eventInfo}>
            <View style={styles.eventInfoRow}>
              <Calendar size={16} color={theme.primary} />
              <Text style={[styles.eventInfoText, { color: theme.textSecondary }]}>
                {formatDate(selectedEvent.date)}
              </Text>
            </View>
            
            {selectedEvent.time && (
              <View style={styles.eventInfoRow}>
                <Clock size={16} color={theme.primary} />
                <Text style={[styles.eventInfoText, { color: theme.textSecondary }]}>
                  {formatTime(selectedEvent.time)}
                </Text>
              </View>
            )}
            
            <View style={styles.eventInfoRow}>
              <MapPin size={16} color={theme.primary} />
              <Text style={[styles.eventInfoText, { color: theme.textSecondary }]} numberOfLines={1}>
                {selectedEvent.location}
              </Text>
            </View>
            
            {selectedEvent.participants && (
              <View style={styles.eventInfoRow}>
                <Users size={16} color={theme.primary} />
                <Text style={[styles.eventInfoText, { color: theme.textSecondary }]}>
                  {selectedEvent.participants} participantes
                </Text>
              </View>
            )}
          </View>
          
          {/* Botões de ação */}
          <View style={styles.eventCardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.directionsButton, { backgroundColor: theme.success }]}
              onPress={openExternalMaps}
            >
              <ExternalLink size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Direções</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton, { backgroundColor: theme.primary }]}
              onPress={goToEventDetails}
            >
              <Text style={styles.actionButtonText}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Contador de eventos */}
      <TouchableOpacity 
        onPress={centerMapOnEvents}
        style={[styles.eventsCounter, { backgroundColor: theme.surface }, theme.cardShadow]}
      >
        <Text style={[styles.eventsCounterText, { color: theme.text }]}>
          {filteredEvents.length} de {events.length} eventos
        </Text>
        <MapPin size={14} color={theme.primary} style={{ marginLeft: 6 }} />
        {getFilterCount() > 0 && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
            <Text style={[styles.clearFiltersText, { color: theme.primary }]}>Limpar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Modal de Filtros */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filtersModal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filtrar Eventos</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersContent}>
              <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Categorias</Text>
              
              <View style={styles.categoriesGrid}>
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        { backgroundColor: theme.borderLight },
                        isSelected && { backgroundColor: category.color }
                      ]}
                      onPress={() => toggleCategoryFilter(category.id)}
                    >
                      <IconComponent 
                        size={20} 
                        color={isSelected ? '#ffffff' : category.color} 
                      />
                      <Text style={[
                        styles.categoryText,
                        { color: isSelected ? '#ffffff' : theme.text }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: theme.borderLight }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>
                  Limpar Tudo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>
                  Aplicar ({filteredEvents.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 12,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  clusterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Estilos para feedback visual do cluster
  clusterMarkerActive: {
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  clusterTextActive: {
    fontWeight: '700',
  },
  clusterPulse: {
    position: 'absolute',
    top: -25,
    left: -5,
    right: -5,
    alignItems: 'center',
  },
  clusterHint: {
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 16,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventInfo: {
    marginBottom: 16,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventInfoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  viewEventButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewEventButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  directionsButton: {
    gap: 6,
  },
  detailsButton: {
    // Styles específicos se necessário
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsCounter: {
    position: 'absolute',
    top: 150, // Alinhado com os botões de controle (controlsContainer)
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsCounterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearFiltersButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  filtersContent: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapScreen;
