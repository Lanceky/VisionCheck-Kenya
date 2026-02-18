import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>👁️</Text>
        <Text style={styles.title}>VisionCheck Kenya</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.body}>
          VisionCheck Kenya is a mobile vision screening tool designed to make basic eye testing
          accessible to everyone in Kenya and beyond. It is not a substitute for a professional
          eye examination.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tests Included</Text>
        <Text style={styles.body}>• Visual Acuity (Snellen + Jaeger)</Text>
        <Text style={styles.body}>• Colour Vision (Ishihara plates)</Text>
        <Text style={styles.body}>• Astigmatism (Fan chart)</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This app is for screening purposes only. Please visit a qualified optometrist for
          a comprehensive eye examination.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: '#00ACC1', paddingTop: 56, paddingBottom: 28, alignItems: 'center' },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  version: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 10 },
  body: { fontSize: 15, color: '#424242', lineHeight: 22 },
  disclaimer: { marginHorizontal: 16, marginTop: 20, padding: 14, backgroundColor: '#FFF3E0', borderRadius: 10 },
  disclaimerText: { fontSize: 13, color: '#E65100', lineHeight: 19, textAlign: 'center' },
});
