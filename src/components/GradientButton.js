import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import WebCompatibleGradient from './WebCompatibleGradient';

const GradientButton = ({ 
  title, 
  onPress, 
  disabled = false, 
  colors = ['#007AFF', '#0056D6'], 
  style = {},
  textStyle = {} 
}) => {
  return (
    <WebCompatibleGradient
      colors={disabled ? ['#cccccc', '#999999'] : colors}
      style={[styles.button, style, disabled && styles.disabled]}
    >
      <TouchableOpacity 
        style={styles.buttonContent}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </TouchableOpacity>
    </WebCompatibleGradient>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default GradientButton;
