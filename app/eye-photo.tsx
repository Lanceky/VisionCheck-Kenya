import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function EyePhotoScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Eye Photo Capture</Text>
      <Text style={styles.body}>This screen will allow you to capture an eye photo for AI analysis.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#212121', marginBottom: 12 },
  body: { fontSize: 15, color: '#616161', textAlign: 'center', lineHeight: 22 },
});
