// Componente alternativo para web que não usa react-native-maps
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WebMapView = ({ children, ...props }) => {
  return (
    <View style={[styles.webMap, props.style]}>
      <Text style={styles.webMapText}>
        Mapa não disponível na web. Use a versão mobile para visualizar eventos no mapa.
      </Text>
      {children}
    </View>
  );
};

const WebMarker = ({ children, ...props }) => {
  return <View>{children}</View>;
};

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export { WebMapView as default, WebMarker as Marker };
export const PROVIDER_GOOGLE = null;
