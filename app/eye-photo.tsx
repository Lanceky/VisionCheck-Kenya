import { EyeAnalysisResults, EyePhotoAnalysisResult, EyePhotoCapture } from '@/components/VisionTests';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function EyePhotoScreen() {
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<EyePhotoAnalysisResult | null>(null);

  const handleCaptureComplete = (results: EyePhotoAnalysisResult) => {
    setAnalysisResults(results);
    setShowResults(true);
    // TODO: Save results to Appwrite database
    console.log('Eye photo analysis results:', results);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Eye Photo Test?',
      'Are you sure you want to skip the eye photo analysis?',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleDone = () => {
    router.push('/');
  };

  const handleFindClinics = () => {
    router.push('/clinics');
  };

  const handleRetakePhotos = () => {
    setShowResults(false);
    setAnalysisResults(null);
  };

  if (showResults && analysisResults) {
    return (
      <View style={styles.container}>
        <EyeAnalysisResults
          results={analysisResults}
          onDone={handleDone}
          onFindClinics={handleFindClinics}
          onRetakePhotos={handleRetakePhotos}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EyePhotoCapture
        onCaptureComplete={handleCaptureComplete}
        onCancel={handleCancel}
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
