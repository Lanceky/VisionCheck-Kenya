import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Test History</Text>
      <Text style={styles.body}>Your past vision screening results will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#212121', marginBottom: 12 },
  body: { fontSize: 15, color: '#616161', textAlign: 'center', lineHeight: 22 },
});
