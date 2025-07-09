import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Definição dos temas
export const themes = {
  light: {
    // Cores principais
    primary: '#667eea',
    primaryDark: '#5a6fd8',
    primaryLight: '#8fa3f3',
    
    // Backgrounds
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    
    // Textos
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    
    // Borders e divisores
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    
    // Estados
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Específicos
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Status bar
    statusBarStyle: 'dark-content',
    statusBarBackground: '#ffffff',
    
    // Tab bar
    tabBarBackground: '#ffffff',
    tabBarBorder: '#e2e8f0',
    tabBarActive: '#667eea',
    tabBarInactive: '#94a3b8',
    
    // Cards e elementos
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    
    // Input
    inputBackground: '#f8fafc',
    inputBorder: '#e2e8f0',
    inputText: '#1e293b',
    placeholder: '#94a3b8',
  },
  
  dark: {
    // Cores principais
    primary: '#8fa3f3',
    primaryDark: '#7c91f0',
    primaryLight: '#a8b8f6',
    
    // Backgrounds
    background: '#0f172a',
    surface: '#1e293b',
    card: '#334155',
    
    // Textos
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    
    // Borders e divisores
    border: '#475569',
    borderLight: '#334155',
    
    // Estados
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Específicos
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Status bar
    statusBarStyle: 'light-content',
    statusBarBackground: '#1e293b',
    
    // Tab bar
    tabBarBackground: '#1e293b',
    tabBarBorder: '#475569',
    tabBarActive: '#8fa3f3',
    tabBarInactive: '#64748b',
    
    // Cards e elementos
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    // Input
    inputBackground: '#334155',
    inputBorder: '#475569',
    inputText: '#f1f5f9',
    placeholder: '#94a3b8',
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tema salvo ao inicializar
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('@theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const setTheme = async (theme) => {
    try {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      await AsyncStorage.setItem('@theme_preference', theme);
    } catch (error) {
      console.error('Erro ao definir tema:', error);
    }
  };

  const currentTheme = isDarkMode ? themes.dark : themes.light;

  const value = {
    isDarkMode,
    theme: {
      colors: currentTheme,
      ...currentTheme  // Também disponibilizar as cores diretamente
    },
    toggleTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
