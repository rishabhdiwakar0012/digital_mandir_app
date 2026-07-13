import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsOnline } from '../../store/appStore';

export function OfflineBanner() {
  const isOnline = useIsOnline();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={14} color="#FFF" />
      <Text style={styles.text}>You are offline. Changes will sync when back online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E65100',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },
});
