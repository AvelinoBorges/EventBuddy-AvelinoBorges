import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Heart, User, MapPin } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import EventsScreen from '../screens/EventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyParticipationsScreen from '../screens/MyParticipationsScreen';
import MapScreen from '../screens/MapScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator para a aba Home
const HomeStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Removemos o header para usar o da nova tela
      }}
    >
      <Stack.Screen 
        name="HomeList" 
        component={EventsScreen} 
        options={{ title: 'Eventos' }}
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ 
          title: 'Detalhes do Evento',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Stack navigator para a aba Map
const MapStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Removemos o header para usar o da nova tela
      }}
    >
      <Stack.Screen 
        name="MapList" 
        component={MapScreen} 
        options={{ title: 'Mapa' }}
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ 
          title: 'Detalhes do Evento',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Stack navigator para a aba Favorites
const FavoritesStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Removemos o header para usar o da nova tela
      }}
    >
      <Stack.Screen 
        name="FavoritesList" 
        component={FavoritesScreen} 
        options={{ title: 'Favoritos' }}
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ 
          title: 'Detalhes do Evento',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Stack navigator para a aba Profile
const ProfileStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }}
      />
      <Stack.Screen 
        name="MyParticipations" 
        component={MyParticipationsScreen}
        options={{ 
          title: 'Minhas Participações',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ 
          title: 'Detalhes do Evento',
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Navegação principal com Bottom Tabs
const MainTabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapStackNavigator}
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <MapPin size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStackNavigator}
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => (
            <Heart size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
