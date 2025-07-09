import React from 'react';
import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const WebCompatibleGradient = ({ colors, style, children, ...props }) => {
  // Para web, usa CSS gradient
  if (Platform.OS === 'web') {
    const gradientStyle = {
      background: `linear-gradient(135deg, ${colors.join(', ')})`,
      ...style,
    };

    return (
      <View style={gradientStyle} {...props}>
        {children}
      </View>
    );
  }

  // Para mobile, usa expo-linear-gradient
  return (
    <LinearGradient colors={colors} style={style} {...props}>
      {children}
    </LinearGradient>
  );
};

export default WebCompatibleGradient;
