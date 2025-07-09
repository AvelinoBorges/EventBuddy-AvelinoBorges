import React, { useRef, useEffect } from 'react';
import { View, TextInput, Text, Animated, StyleSheet } from 'react-native';

const ModernInput = ({ 
  label, 
  icon, 
  value, 
  onChangeText, 
  onFocus, 
  onBlur, 
  focused,
  ...props 
}) => {
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: focused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

  const handleFocus = (e) => {
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    onBlur && onBlur(e);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: borderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#E5E5EA', '#007AFF'],
            }),
            backgroundColor: borderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#F8F9FA', '#FFFFFF'],
            }),
            shadowOpacity: borderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.15],
            }),
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Animated.Text
            style={[
              styles.label,
              {
                fontSize: labelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 12],
                }),
                color: labelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#999', '#007AFF'],
                }),
                transform: [
                  {
                    translateY: labelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                ],
              },
            ]}
          >
            {label}
          </Animated.Text>
          
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 64,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
    opacity: 0.7,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    fontWeight: '500',
    zIndex: 1,
  },
  input: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 40,
  },
});

export default ModernInput;
