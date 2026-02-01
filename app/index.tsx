import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Index() {
  const handleStartTest = () => {
    router.push('/test-suite');
  };

  const handleEyePhotoOnly = () => {
    router.push('/eye-photo');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleFindClinics = () => {
    router.push('/clinics');
  };

  const handleLearnMore = () => {
    router.push('/about');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>👁️</Text>
          <Text style={styles.title}>VisionCheck Kenya</Text>
          <Text style={styles.subtitle}>
            Bringing eye screening to every smartphone
          </Text>
        </View>

        {/* Main Action Card */}
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Quick Vision Screening</Text>
          <Text style={styles.cardDescription}>
            Complete a comprehensive eye screening in just 5 minutes
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartTest}>
            <Text style={styles.primaryButtonText}>Start Test Now</Text>
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>What We Test</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>👀</Text>
              <Text style={styles.featureTitle}>Visual Acuity</Text>
              <Text style={styles.featureDescription}>
                Test clarity of vision for both eyes
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureTitle}>Color Vision</Text>
              <Text style={styles.featureDescription}>
                Screen for color blindness
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🕒</Text>
              <Text style={styles.featureTitle}>Astigmatism</Text>
              <Text style={styles.featureDescription}>
                Detect corneal irregularities
              </Text>
            </View>

            <TouchableOpacity style={styles.featureCard} onPress={handleEyePhotoOnly}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureTitle}>Eye Photos</Text>
              <Text style={styles.featureDescription}>
                AI analysis of eye health
              </Text>
              <Text style={styles.featureTap}>Tap to try →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleFindClinics}>
              <Text style={styles.featureIcon}>🏥</Text>
              <Text style={styles.featureTitle}>Find Clinics</Text>
              <Text style={styles.featureDescription}>
                Locate nearby eye care
              </Text>
              <Text style={styles.featureTap}>Tap to search →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewHistory}
          >
            <Text style={styles.secondaryButtonText}>📊 View Test History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleFindClinics}
          >
            <Text style={styles.secondaryButtonText}>🗺️ Find Eye Clinics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLearnMore}
          >
            <Text style={styles.secondaryButtonText}>ℹ️ About VisionCheck</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            💡 Over 4 million Kenyans have undiagnosed vision problems. 
            Early screening can make a huge difference!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  featureTap: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 6,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});
