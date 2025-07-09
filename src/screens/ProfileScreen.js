import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  RefreshControl,
  Image,
  Switch,
} from 'react-native';
import { 
  UserCircle, 
  User, 
  Mail, 
  MapPin, 
  Pencil, 
  Heart, 
  CalendarCheck, 
  LogOut,
  Settings,
  X,
  Save,
  Camera,
  Trash2,
  Moon,
  Sun,
  Bell
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { eventService } from '../services/eventService';
import { avatarService } from '../services/avatarService';
import NotificationSettings from '../components/NotificationSettings';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { getFavoritesCount, favoriteEvents, loadUserFavorites } = useFavorites();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { notificationSettings, permissionGranted } = useNotifications();
  
  // Verificação de segurança para o tema
  if (!theme || (!theme.colors && !theme.surface)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Carregando tema...</Text>
      </View>
    );
  }
  
  const [userStats, setUserStats] = useState({
    favorites: 0,
    participations: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    location: ''
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  console.log('ProfileScreen renderizando...', { user });

  useEffect(() => {
    // Carregar estatísticas do usuário quando o componente montar ou usuário mudar
    loadUserStats();
    // Carregar avatar do usuário
    loadUserAvatar();
  }, [user]);

  // Atualizar contagem de favoritos automaticamente quando favoriteEvents mudar
  useEffect(() => {
    if (user) {
      setUserStats(prev => ({
        ...prev,
        favorites: getFavoritesCount()
      }));
    }
  }, [favoriteEvents, getFavoritesCount, user]);

  // Listener para mudanças do perfil - recarregar quando necessário
  useEffect(() => {
    const handleFocus = () => {
      // Recarregar dados quando a tela ganhar foco (útil quando volta de MyParticipations)
      if (user) {
        refreshStats();
      }
    };

    const unsubscribe = navigation?.addListener('focus', handleFocus);
    return unsubscribe;
  }, [navigation, user]);

  // Auto-refresh das participações a cada 30 segundos quando a tela está ativa
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Apenas atualizar participações silenciosamente (sem recarregar favoritos)
      updateParticipations();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  // Carregar preferência do AsyncStorage (opcional)
  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem('notificationsEnabled');
        if (value !== null) setNotificationsEnabled(value === 'true');
      } catch {}
    })();
  }, []);

  // Salvar preferência
  useEffect(() => {
    AsyncStorage.setItem('notificationsEnabled', notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  // Solicitar permissão e agendar/cancelar notificações
  useEffect(() => {
    if (notificationsEnabled) {
      requestAndScheduleNotifications();
    } else {
      cancelAllNotifications();
    }
  }, [notificationsEnabled, userStats.participations]);

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      // Buscar dados do usuário do Firestore
      const result = await eventService.getUserData(user.uid);
      if (result.success) {
        const userData = result.data;
        
        // Atualizar estatísticas com dados do Firestore
        const newStats = {
          favorites: userData.favorites?.length || 0,
          participations: userData.participations?.length || 0
        };
        
        // Usar a contagem de favoritos do contexto se for maior (mais atualizada)
        const contextFavorites = getFavoritesCount();
        if (contextFavorites > newStats.favorites) {
          newStats.favorites = contextFavorites;
        }
        
        setUserStats(newStats);
        
        // Preencher formulário de edição com dados atuais
        setEditForm({
          displayName: userData.displayName || user.displayName || '',
          location: userData.location || ''
        });
        
        // Carregar avatar
        setAvatarUrl(userData.avatarUrl || null);
      } else {
        // Se o usuário não existe no Firestore, criar com dados básicos
        await createUserDocument();
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Usar contagem de favoritos do contexto como fallback
      setUserStats({
        favorites: getFavoritesCount(),
        participations: 0
      });
    }
  };

  const createUserDocument = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        location: '',
        favorites: [],
        participations: [],
        avatarUrl: null,
        createdAt: new Date()
      });
      
      // Definir estados iniciais
      setUserStats({ favorites: 0, participations: 0 });
      setAvatarUrl(null);
      setEditForm({
        displayName: user.displayName || '',
        location: ''
      });
    } catch (error) {
      console.error('Erro ao criar documento do usuário:', error);
    }
  };

  const loadUserAvatar = async () => {
    if (!user) return;
    
    try {
      const result = await avatarService.getUserAvatar(user.uid);
      if (result.success) {
        setAvatarUrl(result.avatarUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar avatar:', error);
    }
  };

  const handleAvatarPress = () => {
    setShowAvatarModal(true);
  };

  const handleSelectImage = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      // Selecionar imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Solicitar permissões
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos de permissão para acessar a câmera');
        return;
      }

      // Tirar foto
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const uploadAvatar = async (imageUri) => {
    setUploadingAvatar(true);
    setShowAvatarModal(false);
    
    try {
      const result = await avatarService.uploadAvatar(user.uid, imageUri);
      
      if (result.success) {
        setAvatarUrl(result.avatarUrl);
        Alert.alert('Sucesso', 'Avatar atualizado com sucesso!');
      } else {
        Alert.alert('Erro', 'Não foi possível fazer upload do avatar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Erro inesperado ao fazer upload');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem certeza que deseja remover seu avatar?');
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Remover Avatar',
        'Tem certeza que deseja remover seu avatar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: () => confirmRemoveAvatar() }
        ]
      );
      return;
    }
    
    await confirmRemoveAvatar();
  };

  const confirmRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setShowAvatarModal(false);
    
    try {
      const result = await avatarService.removeAvatar(user.uid);
      
      if (result.success) {
        setAvatarUrl(null);
        Alert.alert('Sucesso', 'Avatar removido com sucesso!');
      } else {
        Alert.alert('Erro', 'Não foi possível remover o avatar: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      Alert.alert('Erro', 'Erro inesperado ao remover avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Se não há usuário, mostra loading
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('Tem certeza que deseja sair da sua conta?');
        if (confirmed) {
          const result = await logout();
          if (!result.success) {
            alert('Erro: ' + result.error);
          }
        }
      } else {
        Alert.alert(
          'Sair',
          'Tem certeza que deseja sair da sua conta?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Sair',
              style: 'destructive',
              onPress: async () => {
                const result = await logout();
                if (!result.success) {
                  Alert.alert('Erro', result.error);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erro no logout:', error);
      if (Platform.OS === 'web') {
        alert('Erro inesperado: ' + error.message);
      } else {
        Alert.alert('Erro', 'Erro inesperado: ' + error.message);
      }
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Verificar se o documento do usuário existe
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Criar documento do usuário se não existir
        await setDoc(userRef, {
          email: user.email,
          displayName: editForm.displayName,
          location: editForm.location,
          favorites: [],
          participations: [],
          createdAt: new Date()
        });
      } else {
        // Atualizar dados existentes
        await updateDoc(userRef, {
          displayName: editForm.displayName,
          location: editForm.location
        });
      }

      // Fechar modal e recarregar dados
      setShowEditModal(false);
      
      // Recarregar dados do usuário e favoritos
      await Promise.all([
        loadUserStats(),
        loadUserFavorites() // Recarregar favoritos do contexto
      ]);
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    }
  };

  const handleMyFavorites = () => {
    // Navegar para a aba de favoritos
    navigation.navigate('Favorites');
  };

  const handleMyEvents = async () => {
    // Navegar para a tela de participações
    navigation.navigate('MyParticipations');
  };

  // Função para atualizar apenas participações (mais leve)
  const updateParticipations = async () => {
    if (!user) return;
    
    try {
      const result = await eventService.getUserData(user.uid);
      if (result.success) {
        const userData = result.data;
        setUserStats(prev => ({
          ...prev,
          participations: userData.participations?.length || 0
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar participações:', error);
    }
  };

  // Função para forçar atualização das estatísticas
  const refreshStats = async () => {
    if (user) {
      await loadUserStats();
      await loadUserFavorites();
    }
  };

  // Função para pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  // Função para agendar notificações locais para eventos futuros
  const requestAndScheduleNotifications = async () => {
    if (!user || !favoriteEvents || favoriteEvents.length === 0) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    // Cancelar notificações antigas
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Agendar para cada evento futuro salvo
    const now = new Date();
    favoriteEvents.forEach(event => {
      if (!event.date || !event.time) return;
      const eventDate = new Date(`${event.date}T${event.time}`);
      if (eventDate > now) {
        // Notificar 1 hora antes
        const notifyDate = new Date(eventDate.getTime() - 60 * 60 * 1000);
        if (notifyDate > now) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Lembrete de Evento',
              body: `Seu evento "${event.title}" começa em 1 hora!`,
              sound: true,
            },
            trigger: notifyDate,
          });
        }
      }
    });
  };

  // Função para cancelar todas as notificações
  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.statusBarBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <UserCircle size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Avatar e informações principais */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={[styles.avatar, { backgroundColor: theme.primary }, uploadingAvatar && styles.avatarUploading]} 
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
            >
              {avatarUrl ? (
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatarImage}
                  onError={() => {
                    console.log('Erro ao carregar avatar, voltando para inicial');
                    setAvatarUrl(null);
                  }}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user?.email)}</Text>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <Text style={styles.uploadingText}>...</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cameraButton, { backgroundColor: theme.primary }]} 
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
            >
              <Camera size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: theme.text }]}>
            {editForm.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
          
          {/* Mensagem se perfil incompleto */}
          {!editForm.displayName && !user?.displayName && (
            <View style={styles.incompleteProfileContainer}>
              <Text style={styles.incompleteProfileText}>
                Complete seu perfil para uma melhor experiência
              </Text>
            </View>
          )}
        </View>

        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <Heart size={24} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{userStats.favorites}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Favoritos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <CalendarCheck size={24} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{userStats.participations}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Participações</Text>
          </View>
        </View>

        {/* Dados do usuário */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Informações Pessoais</Text>
          
          <TouchableOpacity style={[styles.infoItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.infoItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                <User size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nome completo</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {editForm.displayName || user?.displayName || 'Não informado'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.infoItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.infoItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                <Mail size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{user?.email}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.infoItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.infoItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                <MapPin size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Localização</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {editForm.location || user?.location || 'Não informado'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Botão Editar Perfil */}
          <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary }]} onPress={handleEditProfile}>
            <Pencil size={20} color="#ffffff" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Configurações */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Configurações</Text>
          
          {/* Configurações de Notificação */}
          <View style={[styles.actionItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                <Bell size={20} color={theme.primary} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Notificações</Text>
            </View>
            <TouchableOpacity onPress={() => setShowNotificationSettings(true)}>
              <View style={[styles.settingsButton, { backgroundColor: theme.borderLight }]}>
                <Settings size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Toggle Tema */}
          <View style={[styles.actionItem, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                {isDarkMode ? (
                  <Moon size={20} color={theme.primary} />
                ) : (
                  <Sun size={20} color={theme.primary} />
                )}
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Tema escuro</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.borderLight, true: theme.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor={theme.borderLight}
            />
          </View>
        </View>

        {/* Ações rápidas */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ações Rápidas</Text>
          
          <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.surface }, theme.cardShadow]} onPress={handleMyFavorites}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                <Heart size={20} color={theme.primary} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Meus eventos salvos</Text>
            </View>
            <Text style={[styles.actionCount, { backgroundColor: theme.borderLight, color: theme.primary }]}>{userStats.favorites}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.surface }, theme.cardShadow]} onPress={handleMyEvents}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.borderLight }]}>
                <CalendarCheck size={20} color={theme.primary} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Minhas participações</Text>
            </View>
            <Text style={[styles.actionCount, { backgroundColor: theme.borderLight, color: theme.primary }]}>{userStats.participations}</Text>
          </TouchableOpacity>

          {/* Botão de logout */}
          <TouchableOpacity style={[styles.logoutItem, { backgroundColor: theme.surface, borderColor: isDarkMode ? '#7f1d1d' : '#fee2e2' }, theme.cardShadow]} onPress={handleLogout}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.logoutIconContainer, { backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2' }]}>
                <LogOut size={20} color={theme.error} />
              </View>
              <Text style={[styles.logoutText, { color: theme.error }]}>Sair da conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Espaço extra para scroll */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de Avatar - Versão Discreta */}
      <Modal
        visible={showAvatarModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarModal(false)}
        >
          <View style={[styles.avatarModalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.avatarModalTitle, { color: theme.text }]}>Alterar foto</Text>
            
            <TouchableOpacity style={[styles.avatarOptionSimple, { borderBottomColor: theme.borderLight }]} onPress={handleSelectImage}>
              <Text style={[styles.avatarOptionTextSimple, { color: theme.text }]}>Escolher da galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.avatarOptionSimple, { borderBottomColor: theme.borderLight }]} onPress={handleTakePhoto}>
              <Text style={[styles.avatarOptionTextSimple, { color: theme.text }]}>Tirar foto</Text>
            </TouchableOpacity>

            {avatarUrl && (
              <TouchableOpacity style={styles.avatarOptionSimple} onPress={handleRemoveAvatar}>
                <Text style={[styles.avatarOptionTextDanger, { color: theme.error }]}>Remover foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Edição de Perfil */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {/* Header do modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Editar Perfil</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Nome completo</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <User size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.textInput, { color: theme.inputText }]}
                    value={editForm.displayName}
                    onChangeText={(text) => setEditForm({...editForm, displayName: text})}
                    placeholder="Digite seu nome completo"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Localização</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <MapPin size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.textInput, { color: theme.inputText }]}
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({...editForm, location: text})}
                    placeholder="Digite sua cidade"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </View>
            </View>

            {/* Botões de ação */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.borderLight, borderColor: theme.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveProfile}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Configurações de Notificação */}
      <NotificationSettings
        visible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarUploading: {
    opacity: 0.7,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  incompleteProfileContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  incompleteProfileText: {
    color: '#92400e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  actionsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  notificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  logoutItem: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 8,
    marginRight: -8,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Estilos do Modal de Avatar
  avatarModalContent: {
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  avatarOptionSimple: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  avatarOptionTextSimple: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  avatarOptionTextDanger: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ProfileScreen;
