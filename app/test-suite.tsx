import { CompleteScreeningFlow, CompleteScreeningResult } from '@/components/VisionTests';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function TestSuiteScreen() {
  const handleTestComplete = async (results: CompleteScreeningResult) => {
    try {
      // TODO: Save results to Appwrite database
      console.log('Complete screening results:', results);

      // Navigate to results screen with the data
      router.push({
        pathname: '/results',
        params: { resultsData: JSON.stringify(results) },
      });
    } catch (error) {
      console.error('Error saving results:', error);
      Alert.alert(
        'Error',
        'Failed to save test results. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Screening?',
      'Are you sure you want to cancel the vision screening? Your progress will be lost.',
      [
        { text: 'Continue Screening', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CompleteScreeningFlow
        onComplete={handleTestComplete}
        onCancel={handleCancel}
        includeEyePhotos={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
