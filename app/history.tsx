import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HistoryScreen() {
  // TODO: Fetch test history from Appwrite database
  const testHistory = [
    // Placeholder data
    {
      id: '1',
      date: new Date().toISOString(),
      leftEyeAcuity: '20/30',
      rightEyeAcuity: '20/25',
      colorVision: 'Normal',
    },
  ];

  const handleViewDetails = (testId: string) => {
    // TODO: Navigate to detailed results
    console.log('View test:', testId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {testHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Test History</Text>
            <Text style={styles.emptyDescription}>
              You haven't taken any vision tests yet. Start your first screening to track your eye health over time.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/test-suite')}
            >
              <Text style={styles.primaryButtonText}>Take First Test</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyList}>
            {testHistory.map((test) => (
              <TouchableOpacity
                key={test.id}
                style={styles.historyCard}
                onPress={() => handleViewDetails(test.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>
                    {new Date(test.date).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.viewDetailsText}>View →</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Left Eye:</Text>
                    <Text style={styles.resultValue}>{test.leftEyeAcuity}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Right Eye:</Text>
                    <Text style={styles.resultValue}>{test.rightEyeAcuity}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Color Vision:</Text>
                    <Text style={styles.resultValue}>{test.colorVision}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyList: {
    gap: 15,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 15,
    color: '#666',
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
