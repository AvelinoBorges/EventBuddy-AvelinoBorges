/**
 * Utilitário para redirecionamento para aplicativos de mapas externos
 * Permite abrir direções para um local em aplicativos de mapas populares
 */

import { Platform, Alert, Linking } from 'react-native';

/**
 * Configurações de aplicativos de mapas suportados
 */
const MAPS_APPS = [
  {
    name: 'Google Maps',
    icon: '🗺️',
    priority: 1,
    ios: (lat, lng, label) => `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
    android: (lat, lng, label) => `google.navigation:q=${lat},${lng}`,
    web: (lat, lng, label) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  },
  {
    name: 'Waze',
    icon: '',
    priority: 2,
    ios: (lat, lng, label) => `waze://?ll=${lat},${lng}&navigate=yes`,
    android: (lat, lng, label) => `waze://?ll=${lat},${lng}&navigate=yes`,
    web: (lat, lng, label) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  },
  {
    name: 'Apple Maps',
    icon: '',
    priority: 3,
    ios: (lat, lng, label) => `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
    android: null
  }
];

/**
 * Verifica se um aplicativo de mapas está disponível
 * @param {Object} app - Configuração do aplicativo
 * @param {number} latitude - Latitude do destino
 * @param {number} longitude - Longitude do destino
 * @param {string} label - Label do destino
 * @returns {Promise<string|null>} URL se disponível, null caso contrário
 */
const checkAppAvailability = async (app, latitude, longitude, label = '') => {
  try {
    let url = null;
    
    if (Platform.OS === 'ios' && app.ios) {
      url = app.ios(latitude, longitude, label);
    } else if (Platform.OS === 'android' && app.android) {
      url = app.android(latitude, longitude, label);
    }

    if (url) {
      const canOpen = await Linking.canOpenURL(url);
      return canOpen ? url : null;
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao verificar ${app.name}:`, error);
    return null;
  }
};

/**
 * Obtém todos os aplicativos de mapas disponíveis no dispositivo
 * @param {number} latitude - Latitude do destino
 * @param {number} longitude - Longitude do destino
 * @param {string} label - Label do destino
 * @returns {Promise<Array>} Lista de aplicativos disponíveis
 */
export const getAvailableMapsApps = async (latitude, longitude, label = '') => {
  const availableApps = [];
  
  for (const app of MAPS_APPS) {
    const url = await checkAppAvailability(app, latitude, longitude, label);
    if (url) {
      availableApps.push({
        ...app,
        url: url
      });
    }
  }
  
  // Ordenar por prioridade
  return availableApps.sort((a, b) => a.priority - b.priority);
};

/**
 * Abre um aplicativo específico de mapas
 * @param {string} url - URL do aplicativo
 * @param {string} appName - Nome do aplicativo (para logs de erro)
 * @returns {Promise<boolean>} True se abriu com sucesso
 */
export const openMapsApp = async (url, appName = 'aplicativo de mapas') => {
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error(`Erro ao abrir ${appName}:`, error);
    Alert.alert('Erro', `Não foi possível abrir ${appName}`);
    return false;
  }
};

/**
 * Abre direções para um local usando o melhor aplicativo disponível
 * @param {number} latitude - Latitude do destino
 * @param {number} longitude - Longitude do destino
 * @param {string} title - Título do destino (opcional)
 * @param {string} address - Endereço do destino (opcional)
 * @param {Object} options - Opções adicionais
 * @returns {Promise<boolean>} True se abriu com sucesso
 */
export const openDirections = async (latitude, longitude, title = '', address = '', options = {}) => {
  if (!latitude || !longitude) {
    Alert.alert('Erro', 'Localização não disponível');
    return false;
  }

  const label = title || address || `${latitude},${longitude}`;
  const availableApps = await getAvailableMapsApps(latitude, longitude, label);

  // Se nenhum app nativo estiver disponível, usar versão web
  if (availableApps.length === 0) {
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    
    try {
      const canOpenWeb = await Linking.canOpenURL(webUrl);
      if (canOpenWeb) {
        return await openMapsApp(webUrl, 'Google Maps (Web)');
      }
    } catch (error) {
      console.error('Erro ao abrir Google Maps web:', error);
    }
    
    Alert.alert('Erro', 'Nenhum aplicativo de mapas disponível');
    return false;
  }

  // Se apenas um app estiver disponível, abrir diretamente
  if (availableApps.length === 1) {
    return await openMapsApp(availableApps[0].url, availableApps[0].name);
  }

  // Se múltiplos apps estiverem disponíveis, mostrar opções
  return showMapsSelection(availableApps, latitude, longitude, title);
};

/**
 * Mostra um diálogo para seleção de aplicativo de mapas
 * @param {Array} availableApps - Aplicativos disponíveis
 * @param {number} latitude - Latitude do destino
 * @param {number} longitude - Longitude do destino
 * @param {string} title - Título do destino
 * @returns {Promise<boolean>} True se mostrou o diálogo
 */
const showMapsSelection = (availableApps, latitude, longitude, title) => {
  return new Promise((resolve) => {
    const buttons = availableApps.map(app => ({
      text: `${app.icon} ${app.name}`,
      onPress: async () => {
        const success = await openMapsApp(app.url, app.name);
        resolve(success);
      }
    }));

    // Adicionar opção para abrir no navegador
    buttons.push({
      text: 'Google Maps',
      onPress: async () => {
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        const success = await openMapsApp(webUrl, 'Google Maps (Web)');
        resolve(success);
      }
    });

    buttons.push({
      text: 'Cancelar',
      style: 'cancel',
      onPress: () => resolve(false)
    });

    Alert.alert(
      '🗺️ Abrir Direções',
      title ? `Como deseja ir para:\n${title}` : 'Escolha o aplicativo de mapas:',
      buttons,
      { 
        cancelable: true,
        onDismiss: () => resolve(false)
      }
    );
  });
};

/**
 * Converte endereço em coordenadas (geocoding simples)
 * @param {string} address - Endereço para converter
 * @returns {Promise<Object|null>} Objeto com latitude e longitude ou null
 */
export const geocodeAddress = async (address) => {
  try {
    // Para uma implementação completa, usar uma API de geocoding
    // Por enquanto, retorna null para usar apenas coordenadas diretas
    console.warn('Geocoding não implementado - use coordenadas diretas');
    return null;
  } catch (error) {
    console.error('Erro no geocoding:', error);
    return null;
  }
};

/**
 * Utilitário rápido para abrir direções com configuração mínima
 * @param {Object} location - Objeto com latitude, longitude e título opcional
 * @returns {Promise<boolean>} True se abriu com sucesso
 */
export const openQuickDirections = async (location) => {
  const { latitude, longitude, title, address, name } = location;
  const locationTitle = title || name || address || 'Destino';
  
  return await openDirections(latitude, longitude, locationTitle, address);
};
