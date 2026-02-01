import { router } from 'expo-router';
import React from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ClinicsScreen() {
  // TODO: Integrate with Google Maps API and fetch real clinic data
  const nearbyClinics = [
    {
      id: '1',
      name: 'Eldoret Eye Clinic',
      address: 'Uganda Road, Eldoret',
      distance: '2.3 km',
      phone: '+254 712 345 678',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Vision Care Center',
      address: 'Oloo Street, Eldoret',
      distance: '3.7 km',
      phone: '+254 722 123 456',
      rating: 4.8,
    },
    {
      id: '3',
      name: 'Moi Teaching and Referral Hospital - Eye Dept',
      address: 'Nandi Road, Eldoret',
      distance: '5.1 km',
      phone: '+254 53 203 3471',
      rating: 4.3,
    },
  ];

  // Quick access cards for vision tests and tools
  const testCards = [
    { id: 't1', title: 'Visual Acuity', icon: '👁️', route: '/visual-acuity' },
    { id: 't2', title: 'Color Vision', icon: '🌈', route: '/color-vision' },
    { id: 't3', title: 'Astigmatism', icon: '🕒', route: '/astigmatism' },
    { id: 't4', title: 'AI Eye Photo', icon: '📸', route: '/eye-photo' },
  ];

  const handleCallClinic = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleGetDirections = (clinicName: string) => {
    // TODO: Open Google Maps with directions
    const query = encodeURIComponent(clinicName + ', Eldoret, Kenya');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleNavigateTest = (route: string) => {
    // navigate to the test screen (assumes these routes exist in the app)
    try {
  // use object form to satisfy typed router signatures
  router.push({ pathname: route } as any);
    } catch (e) {
      // fallback: console log if route missing
      console.warn('Navigation failed', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Eye Clinics</Text>
        <Text style={styles.headerSubtitle}>Nearby affordable eye care</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            🗺️ Showing eye care facilities near Eldoret
          </Text>
        </View>

        <View style={styles.testGrid}>
          {testCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.testCard}
              onPress={() => handleNavigateTest(card.route)}
            >
              <Text style={styles.testCardIcon}>{card.icon}</Text>
              <Text style={styles.testCardTitle}>{card.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.clinicsList}>
          {nearbyClinics.map((clinic) => (
            <View key={clinic.id} style={styles.clinicCard}>
              <View style={styles.clinicHeader}>
                <View style={styles.clinicTitleContainer}>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {clinic.rating}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.clinicDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{clinic.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📏</Text>
                  <Text style={styles.detailText}>{clinic.distance} away</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📞</Text>
                  <Text style={styles.detailText}>{clinic.phone}</Text>
                </View>
              </View>

              <View style={styles.clinicActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCallClinic(clinic.phone)}
                >
                  <Text style={styles.actionButtonText}>📞 Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryActionButton]}
                  onPress={() => handleGetDirections(clinic.name)}
                >
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                    🗺️ Directions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Your Visit:</Text>
          <Text style={styles.tipText}>
            • Call ahead to confirm availability and pricing
          </Text>
          <Text style={styles.tipText}>
            • Bring any previous eye test results if available
          </Text>
          <Text style={styles.tipText}>
            • Ask about payment plans if needed
          </Text>
          <Text style={styles.tipText}>
            • Many clinics offer free or subsidized screenings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 15,
    color: '#1976D2',
    textAlign: 'center',
  },
  clinicsList: {
    gap: 15,
    marginBottom: 20,
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clinicHeader: {
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  clinicTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  clinicDetails: {
    gap: 10,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  clinicActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
  },
  primaryActionText: {
    color: '#FFFFFF',
  },
  tipsCard: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 15,
    color: '#1B5E20',
    lineHeight: 24,
    marginBottom: 6,
  },
  testGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  testCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  testCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  testCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
});
