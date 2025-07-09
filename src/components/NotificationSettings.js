import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Settings, Bell, Clock, MapPin, Heart, Trash2 } from 'lucide-react-native';

const NotificationSettings = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const {
    notificationSettings,
    permissionGranted,
    updateSetting,
    clearAllNotifications,
    getScheduledNotifications,
    requestPermissions,
    testLocalNotifications
  } = useNotifications();

  // Verificação de segurança para o tema
  if (!theme || !theme.surface || !theme.text) {
    return null; // Não renderizar se o tema não estiver disponível
  }

  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const reminderOptions = [
    { label: '5 minutos antes', value: 5 },
    { label: '15 minutos antes', value: 15 },
    { label: '30 minutos antes', value: 30 },
    { label: '1 hora antes', value: 60 },
    { label: '2 horas antes', value: 120 },
    { label: '1 dia antes', value: 1440 },
  ];

  const handlePermissionRequest = async () => {
    Alert.alert(
      'Permissão de Notificação',
      'Para receber lembretes de eventos, precisamos da sua permissão para enviar notificações.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Permitir', onPress: async () => {
          const granted = await requestPermissions();
          if (!granted) {
            Alert.alert(
              'Permissão Negada',
              'Você pode ativar as notificações nas configurações do dispositivo.',
              [{ text: 'OK' }]
            );
          }
        }}
      ]
    );
  };

  const handleClearNotifications = async () => {
    Alert.alert(
      'Limpar Notificações',
      'Tem certeza que deseja cancelar todas as notificações agendadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'destructive', onPress: async () => {
          await clearAllNotifications();
          setScheduledCount(0);
          Alert.alert('Sucesso', 'Todas as notificações foram canceladas');
        }}
      ]
    );
  };

  const handleShowScheduled = async () => {
    const notifications = await getScheduledNotifications();
    setScheduledCount(notifications.length);
    
    Alert.alert(
      'Notificações Agendadas',
      `Você tem ${notifications.length} notificações agendadas.`,
      [{ text: 'OK' }]
    );
  };

  const formatReminderTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutos antes`;
    } else if (minutes < 1440) {
      return `${minutes / 60} hora${minutes / 60 > 1 ? 's' : ''} antes`;
    } else {
      return `${minutes / 1440} dia${minutes / 1440 > 1 ? 's' : ''} antes`;
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
      ...theme.cardShadow,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeButton: {
      padding: 5,
    },
    closeButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    scrollContainer: {
      maxHeight: 400,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 10,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.card,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingInfo: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    settingDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    reminderButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    reminderButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginTop: 10,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    dangerButton: {
      backgroundColor: theme.error,
    },
    permissionAlert: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.warning,
      borderLeftWidth: 4,
      borderLeftColor: theme.warning,
    },
    permissionText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 10,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerContainer: {
      backgroundColor: theme.surface,
      borderRadius: 15,
      padding: 20,
      width: '80%',
      maxHeight: 400,
      ...theme.cardShadow,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    pickerOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    pickerOptionText: {
      fontSize: 16,
      color: theme.text,
      textAlign: 'center',
    },
    pickerOptionTextSelected: {
      color: 'white',
      fontWeight: '600',
    },
    pickerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    pickerButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginHorizontal: 5,
    },
    pickerButtonCancel: {
      backgroundColor: theme.border,
    },
    pickerButtonConfirm: {
      backgroundColor: theme.primary,
    },
    pickerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    pickerButtonTextCancel: {
      color: theme.text,
    },
    pickerButtonTextConfirm: {
      color: 'white',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Configurações</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {!permissionGranted && (
              <View style={styles.permissionAlert}>
                <Text style={styles.permissionText}>
                  Permissão de notificação necessária para receber lembretes
                </Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handlePermissionRequest}
                >
                  <Bell size={16} color="white" />
                  <Text style={styles.actionButtonText}>Solicitar Permissão</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipos de Notificação</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Bell size={20} color={theme.primary} style={styles.settingIcon} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Lembretes de Eventos</Text>
                    <Text style={styles.settingDescription}>
                      Receba lembretes antes dos eventos começarem
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.eventsReminder}
                  onValueChange={(value) => updateSetting('eventsReminder', value)}
                  trackColor={{ false: theme.borderLight, true: theme.primary }}
                  thumbColor="#ffffff"
                  disabled={!permissionGranted}
                  style={{ opacity: permissionGranted ? 1 : 0.5 }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Heart size={20} color={theme.primary} style={styles.settingIcon} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Eventos Favoritos</Text>
                    <Text style={styles.settingDescription}>
                      Notificações para eventos que você favoritou
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.favoriteEvents}
                  onValueChange={(value) => updateSetting('favoriteEvents', value)}
                  trackColor={{ false: theme.borderLight, true: theme.primary }}
                  thumbColor="#ffffff"
                  disabled={!permissionGranted}
                  style={{ opacity: permissionGranted ? 1 : 0.5 }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MapPin size={20} color={theme.primary} style={styles.settingIcon} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Eventos Próximos</Text>
                    <Text style={styles.settingDescription}>
                      Descubra eventos interessantes na sua região
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.nearbyEvents}
                  onValueChange={(value) => updateSetting('nearbyEvents', value)}
                  trackColor={{ false: theme.borderLight, true: theme.primary }}
                  thumbColor="#ffffff"
                  disabled={!permissionGranted}
                  style={{ opacity: permissionGranted ? 1 : 0.5 }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tempo de Lembrete</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Clock size={20} color={theme.primary} style={styles.settingIcon} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Avisar antes de</Text>
                    <Text style={styles.settingDescription}>
                      Quando ser notificado antes do evento
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.reminderButton}
                  onPress={() => setShowReminderPicker(true)}
                >
                  <Text style={styles.reminderButtonText}>
                    {formatReminderTime(notificationSettings.reminderTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gerenciar Notificações</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShowScheduled}
              >
                <Settings size={16} color="white" />
                <Text style={styles.actionButtonText}>Ver Agendadas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={testLocalNotifications}
              >
                <Bell size={16} color="white" />
                <Text style={styles.actionButtonText}>Testar Notificações</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearNotifications}
              >
                <Trash2 size={16} color="white" />
                <Text style={styles.actionButtonText}>Limpar Todas</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Picker de tempo de lembrete */}
      <Modal
        visible={showReminderPicker}
        transparent
        animationType="fade"
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Tempo de Lembrete</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {reminderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    notificationSettings.reminderTime === option.value && styles.pickerOptionSelected
                  ]}
                  onPress={() => updateSetting('reminderTime', option.value)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    notificationSettings.reminderTime === option.value && styles.pickerOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.pickerButtonCancel]}
                onPress={() => setShowReminderPicker(false)}
              >
                <Text style={[styles.pickerButtonText, styles.pickerButtonTextCancel]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.pickerButton, styles.pickerButtonConfirm]}
                onPress={() => setShowReminderPicker(false)}
              >
                <Text style={[styles.pickerButtonText, styles.pickerButtonTextConfirm]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default NotificationSettings;
