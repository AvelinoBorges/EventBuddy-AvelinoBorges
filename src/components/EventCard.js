import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import WebCompatibleGradient from './WebCompatibleGradient';
import { formatDate } from '../utils/dateUtils';
import { formatPrice } from '../utils/priceUtils';
import { useTheme } from '../context/ThemeContext';

const EventCard = ({ event, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }, theme.cardShadow]} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: event.imageUrl || 'https://via.placeholder.com/300x200' }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <WebCompatibleGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        
        {/* Tag de categoria com estilo igual ao botão de favorito não selecionado */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {event.category || event.type || 'Evento'}
          </Text>
        </View>
      </View>
      <WebCompatibleGradient
        colors={[theme.surface, theme.surface]}
        style={styles.content}
      >
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{event.title}</Text>
        <Text style={[styles.location, { color: theme.textSecondary }]} numberOfLines={1}>{event.location}</Text>
        <Text style={[styles.date, { color: theme.primary }]}>{formatDate(event.datetime)}</Text>
        
        {/* Preço do evento */}
        <Text style={[styles.price, { color: theme.textSecondary }]}>
          {formatPrice(event.price)}
        </Text>
        
        <WebCompatibleGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.participantsBadge}
        >
          <Text style={styles.participants}>
            {event.participants?.length || 0} participantes
          </Text>
        </WebCompatibleGradient>
      </WebCompatibleGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  categoryTag: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  participantsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  participants: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});

export default EventCard;
