import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { eventService } from '../services/eventService';
import { useAuth } from './AuthContext';
// Adicionar listeners em tempo real
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar favoritos do usuário quando ele fizer login
  useEffect(() => {
    let unsubscribe = null;
    
    if (user) {
      // Configurar listener em tempo real para dados do usuário
      const userRef = doc(db, 'users', user.uid);
      
      unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const userFavorites = userData.favorites || [];
          setFavorites(new Set(userFavorites));
          
          // Carregar dados completos dos eventos favoritos
          if (userFavorites.length > 0) {
            loadFavoriteEventsData(userFavorites);
          } else {
            setFavoriteEvents([]);
          }
        } else {
          // Se documento não existe, limpar favoritos
          setFavorites(new Set());
          setFavoriteEvents([]);
        }
      }, (error) => {
        console.error('Erro no listener de favoritos:', error);
        // Fallback para carregamento único
        loadUserFavorites();
      });
    } else {
      // Limpar favoritos quando usuário fizer logout
      setFavorites(new Set());
      setFavoriteEvents([]);
    }
    
    // Cleanup listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Carregar favoritos do Firebase
  const loadUserFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await eventService.getUserData(user.uid);
      if (result.success) {
        const userFavorites = result.data.favorites || [];
        setFavorites(new Set(userFavorites));
        
        // Carregar dados completos dos eventos favoritos
        if (userFavorites.length > 0) {
          await loadFavoriteEventsData(userFavorites);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados completos dos eventos favoritos
  const loadFavoriteEventsData = async (favoriteIds) => {
    try {
      const eventsResult = await eventService.getAllEvents();
      if (eventsResult.success) {
        const favoriteEventsData = eventsResult.data.filter(event =>
          favoriteIds.includes(event.id)
        );
        setFavoriteEvents(favoriteEventsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos eventos favoritos:', error);
    }
  };

  // Adicionar evento aos favoritos
  const addToFavorites = async (event) => {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para salvar eventos nos favoritos');
      return false;
    }

    try {
      const result = await eventService.addToFavorites(event.id, user.uid);
      if (result.success) {
        setFavorites(prev => new Set([...prev, event.id]));
        setFavoriteEvents(prev => {
          // Verificar se o evento já está na lista para evitar duplicatas
          if (!prev.find(e => e.id === event.id)) {
            return [...prev, event];
          }
          return prev;
        });
        return true;
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível adicionar aos favoritos');
        return false;
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
      return false;
    }
  };

  // Remover evento dos favoritos
  const removeFromFavorites = async (eventId) => {
    if (!user) return false;

    try {
      const result = await eventService.removeFromFavorites(eventId, user.uid);
      if (result.success) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(eventId);
          return newFavorites;
        });
        setFavoriteEvents(prev => prev.filter(event => event.id !== eventId));
        return true;
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível remover dos favoritos');
        return false;
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
      return false;
    }
  };

  // Toggle favorito (adicionar ou remover)
  const toggleFavorite = async (event) => {
    const isFavorite = favorites.has(event.id);
    
    if (isFavorite) {
      await removeFromFavorites(event.id);
      return !isFavorite;
    } else {
      await addToFavorites(event);
      return !isFavorite;
    }
  };

  // Verificar se um evento é favorito
  const isFavorite = (eventId) => {
    return favorites.has(eventId);
  };

  // Obter contagem de favoritos
  const getFavoritesCount = () => {
    return favorites.size;
  };

  // Atualizar lista de eventos favoritos (útil para refresh)
  const refreshFavoriteEvents = async () => {
    if (favorites.size > 0) {
      await loadFavoriteEventsData([...favorites]);
    } else {
      setFavoriteEvents([]);
    }
  };

  const value = {
    favorites,
    favoriteEvents,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoritesCount,
    refreshFavoriteEvents,
    loadUserFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
