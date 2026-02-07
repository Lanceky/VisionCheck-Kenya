import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Show sticky header when subtitle "Bringing eye screening..." scrolls out of view
    setShowStickyHeader(offsetY > 180);
  };

  const handleStartTest = () => {
    router.push('/test-suite');
  };

  const handleVisualAcuity = () => {
    router.push('/visual-acuity');
  };

  const handleColorVision = () => {
    router.push('/color-vision');
  };

  const handleAstigmatism = () => {
    router.push('/astigmatism');
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#00ACC1" />
      
      <View style={styles.mainContainer}>
        {/* Sticky Header - appears when scrolling */}
        {showStickyHeader && (
          <View style={styles.stickyHeader}>
            <Image 
              source={require('../assets/images/visioncheck2.png')} 
              style={styles.stickyLogo}
              resizeMode="contain"
            />
            <Text style={styles.stickyTitle}>VisionCheck Kenya</Text>
          </View>
        )}
        
        <ScrollView 
        contentContainerStyle={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Main Header - scrolls away */}
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/visioncheck2.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
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
            <TouchableOpacity style={styles.featureCard} onPress={handleVisualAcuity}>
              <Text style={styles.featureIcon}>👓</Text>
              <Text style={styles.featureTitle}>Visual Acuity</Text>
              <Text style={styles.featureDescription}>
                Test clarity of vision for both eyes
              </Text>
              <Text style={styles.featureTap}>Tap to test →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleColorVision}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureTitle}>Color Vision</Text>
              <Text style={styles.featureDescription}>
                Screen for color blindness
              </Text>
              <Text style={styles.featureTap}>Tap to test →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleAstigmatism}>
              <Text style={styles.featureIcon}>◎</Text>
              <Text style={styles.featureTitle}>Astigmatism</Text>
              <Text style={styles.featureDescription}>
                Detect corneal irregularities
              </Text>
              <Text style={styles.featureTap}>Tap to test →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleEyePhotoOnly}>
              <Text style={styles.featureIcon}>🔍</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00ACC1',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  stickyHeader: {
    backgroundColor: '#00ACC1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stickyLogo: {
    width: 36,
    height: 36,
  },
  stickyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  header: {
    backgroundColor: '#00ACC1',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleCompact: {
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#00ACC1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignSelf: 'center',
    minWidth: '70%',
    shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#333333',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  featureTap: {
    fontSize: 11,
    color: '#00ACC1',
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
    borderColor: '#00ACC1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#00ACC1',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#E0F7FA',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00ACC1',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#00838F',
    lineHeight: 20,
  },
});
