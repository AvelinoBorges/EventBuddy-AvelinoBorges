import Constants from 'expo-constants';

export const expoConfig = {
  projectId: Constants.expoConfig?.extra?.eas?.projectId || 'd4f8b123-1234-5678-9abc-def012345678',
  isDevelopment: __DEV__,
  isExpoGo: Constants.appOwnership === 'expo',
};

export default expoConfig;
