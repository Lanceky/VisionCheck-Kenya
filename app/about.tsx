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

export default function AboutScreen() {
  const handleContactEmail = () => {
    Linking.openURL('mailto:evansklan100@gmail.com');
  };

  const handleGitHub = () => {
    Linking.openURL('https://github.com/Lanceky/VisionCheck-Kenya');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About VisionCheck</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionIcon}>🎯</Text>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            To make eye screening accessible to every Kenyan by turning smartphones 
            into powerful vision testing tools. We're working to identify the 4+ million 
            Kenyans living with treatable vision problems.
          </Text>
        </View>

        {/* The Problem */}
        <View style={styles.section}>
          <Text style={styles.sectionIcon}>⚠️</Text>
          <Text style={styles.sectionTitle}>The Problem</Text>
          <Text style={styles.sectionText}>
            Millions of Kenyans live with uncorrected vision problems, not because 
            treatment isn't available, but because they don't know they need it. 
            Children struggle in school, adults live with reduced productivity, 
            all because basic screening is out of reach.
          </Text>
        </View>

        {/* The Solution */}
        <View style={styles.section}>
          <Text style={styles.sectionIcon}>💡</Text>
          <Text style={styles.sectionTitle}>Our Solution</Text>
          <Text style={styles.sectionText}>
            VisionCheck Kenya provides comprehensive vision screening right from your 
            smartphone. No special equipment needed. No internet required for tests. 
            Results in just 5 minutes with clear recommendations.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionIcon}>✨</Text>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>👁️ Visual acuity tests for both eyes</Text>
            <Text style={styles.featureItem}>🎨 Color vision deficiency screening</Text>
            <Text style={styles.featureItem}>📸 AI-powered eye photo analysis</Text>
            <Text style={styles.featureItem}>🗺️ Find nearby affordable clinics</Text>
            <Text style={styles.featureItem}>📊 Track your vision over time</Text>
            <Text style={styles.featureItem}>🌐 Works offline with smart syncing</Text>
            <Text style={styles.featureItem}>🗣️ English and Swahili support</Text>
          </View>
        </View>

        {/* Impact */}
        <View style={styles.impactSection}>
          <Text style={styles.impactTitle}>🌟 Potential Impact</Text>
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <Text style={styles.impactNumber}>4M+</Text>
              <Text style={styles.impactLabel}>Kenyans with vision issues</Text>
            </View>
            <View style={styles.impactCard}>
              <Text style={styles.impactNumber}>5 min</Text>
              <Text style={styles.impactLabel}>Screening time</Text>
            </View>
            <View style={styles.impactCard}>
              <Text style={styles.impactNumber}>Free</Text>
              <Text style={styles.impactLabel}>Basic screening</Text>
            </View>
            <View style={styles.impactCard}>
              <Text style={styles.impactNumber}>24/7</Text>
              <Text style={styles.impactLabel}>Available anytime</Text>
            </View>
          </View>
        </View>

        {/* Technology */}
        <View style={styles.section}>
          <Text style={styles.sectionIcon}>🔧</Text>
          <Text style={styles.sectionTitle}>Technology Stack</Text>
          <Text style={styles.techText}>
            • React Native / Expo - Cross-platform mobile{'\n'}
            • TypeScript - Type-safe development{'\n'}
            • Appwrite - Backend & database{'\n'}
            • OpenAI - AI guidance & vision analysis{'\n'}
            • Google Maps - Clinic finder
          </Text>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionIcon}>👨‍💻</Text>
          <Text style={styles.sectionTitle}>Project Lead</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Evans Langat</Text>{'\n'}
            Based in Eldoret, Kenya{'\n'}
            Passionate about using technology to solve real healthcare challenges
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactEmail}
          >
            <Text style={styles.contactButtonText}>📧 Contact Us</Text>
          </TouchableOpacity>
        </View>

        {/* Hackathon */}
        <View style={styles.hackathonSection}>
          <Text style={styles.hackathonTitle}>🏆 Red White & Build Hackathon</Text>
          <Text style={styles.hackathonText}>
            This project is part of the Red White & Build U.S.-Kenya Hackathon 2026, 
            organized by STEM Impact Center Kenya and the U.S. Embassy Nairobi.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>⚠️ Medical Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            VisionCheck Kenya is a screening tool, not a diagnostic device. It helps 
            identify people who may benefit from professional eye care but does not 
            replace comprehensive eye examinations by licensed optometrists or ophthalmologists.
          </Text>
        </View>

        {/* GitHub */}
        <TouchableOpacity style={styles.githubButton} onPress={handleGitHub}>
          <Text style={styles.githubButtonText}>⭐ View on GitHub</Text>
        </TouchableOpacity>

        {/* Tagline */}
        <Text style={styles.tagline}>"Clear vision should be a right, not a privilege."</Text>
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
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  techText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  impactSection: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  impactTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 20,
    textAlign: 'center',
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  impactCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  impactNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 6,
  },
  impactLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hackathonSection: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  hackathonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
  },
  hackathonText: {
    fontSize: 15,
    color: '#F57C00',
    lineHeight: 22,
  },
  disclaimer: {
    backgroundColor: '#FFEBEE',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  githubButton: {
    backgroundColor: '#24292E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  githubButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 20,
  },
});
