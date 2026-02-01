import { CompleteScreeningResult } from '@/components/VisionTests';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const [results, setResults] = useState<CompleteScreeningResult | null>(null);

  useEffect(() => {
    if (params.resultsData) {
      try {
        const parsedResults = JSON.parse(params.resultsData as string);
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing results:', error);
      }
    }
  }, [params.resultsData]);

  if (!results) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const visionResults = results.visionTests;
  const eyePhotoResults = results.eyePhotoAnalysis;

  const getAcuityRecommendation = (acuity: string) => {
    const acuityValue = parseInt(acuity.split('/')[1]);
    
    if (acuityValue <= 20) {
      return { status: 'Excellent', color: '#4CAF50', message: 'Your vision is excellent!' };
    } else if (acuityValue <= 30) {
      return { status: 'Good', color: '#8BC34A', message: 'Your vision is good, but monitoring recommended.' };
    } else if (acuityValue <= 40) {
      return { status: 'Fair', color: '#FF9800', message: 'Consider getting a professional eye exam.' };
    } else {
      return { status: 'Poor', color: '#F44336', message: 'Professional eye care recommended.' };
    }
  };

  const getColorVisionRecommendation = (deficiency: string) => {
    switch (deficiency) {
      case 'none':
        return { status: 'Normal', color: '#4CAF50', message: 'No color vision deficiency detected.' };
      case 'red-green':
        return { status: 'Red-Green Deficiency', color: '#FF9800', message: 'Possible red-green color blindness detected.' };
      case 'blue-yellow':
        return { status: 'Blue-Yellow Deficiency', color: '#FF9800', message: 'Possible blue-yellow color blindness detected.' };
      case 'severe':
        return { status: 'Severe Deficiency', color: '#F44336', message: 'Significant color vision issues detected.' };
      default:
        return { status: 'Unknown', color: '#999', message: 'Results unclear.' };
    }
  };

  const leftEyeRec = visionResults?.leftEyeAcuity
    ? getAcuityRecommendation(visionResults.leftEyeAcuity.acuity)
    : null;
  const rightEyeRec = visionResults?.rightEyeAcuity
    ? getAcuityRecommendation(visionResults.rightEyeAcuity.acuity)
    : null;
  const colorVisionRec = visionResults?.colorVision
    ? getColorVisionRecommendation(visionResults.colorVision.possibleDeficiency)
    : null;

  const needsProfessionalCare = 
    (leftEyeRec && visionResults?.leftEyeAcuity && parseInt(visionResults.leftEyeAcuity.acuity.split('/')[1]) > 30) ||
    (rightEyeRec && visionResults?.rightEyeAcuity && parseInt(visionResults.rightEyeAcuity.acuity.split('/')[1]) > 30) ||
    (colorVisionRec && visionResults?.colorVision?.possibleDeficiency !== 'none') ||
    (visionResults?.astigmatism?.hasAstigmatism && visionResults.astigmatism.severity !== 'mild') ||
    eyePhotoResults?.requiresProfessionalReview;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Screening Results</Text>
          <Text style={styles.headerSubtitle}>
            Completed on {new Date(results.completedAt).toLocaleDateString()}
          </Text>
          <Text style={styles.durationText}>
            Duration: {formatDuration(results.totalDuration)}
          </Text>
        </View>

        {/* Visual Acuity Results */}
        {visionResults && (visionResults.leftEyeAcuity || visionResults.rightEyeAcuity) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ Visual Acuity Results</Text>

            {visionResults.leftEyeAcuity && leftEyeRec && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.eyeLabel}>Left Eye</Text>
                  <Text style={[styles.acuityScore, { color: leftEyeRec.color }]}>
                    {visionResults.leftEyeAcuity.distanceAcuity || visionResults.leftEyeAcuity.acuity}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: leftEyeRec.color + '20' }]}>
                  <Text style={[styles.statusText, { color: leftEyeRec.color }]}>
                    {leftEyeRec.status}
                  </Text>
                </View>
                {/* Near/Far Vision Assessment */}
                {visionResults.leftEyeAcuity.nearAcuity && (
                  <View style={styles.visionTypeContainer}>
                    <Text style={styles.visionTypeLabel}>
                      📏 Distance: {visionResults.leftEyeAcuity.distanceAcuity || visionResults.leftEyeAcuity.acuity}
                    </Text>
                    <Text style={styles.visionTypeLabel}>
                      📖 Near: {visionResults.leftEyeAcuity.nearAcuity}
                    </Text>
                  </View>
                )}
                {(visionResults.leftEyeAcuity.possibleMyopia || visionResults.leftEyeAcuity.possibleHyperopia) && (
                  <View style={styles.conditionContainer}>
                    {visionResults.leftEyeAcuity.possibleMyopia && (
                      <View style={[styles.conditionBadge, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={styles.conditionText}>🔍 Possible Nearsightedness</Text>
                      </View>
                    )}
                    {visionResults.leftEyeAcuity.possibleHyperopia && (
                      <View style={[styles.conditionBadge, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={styles.conditionText}>📖 Possible Farsightedness</Text>
                      </View>
                    )}
                  </View>
                )}
                {visionResults.leftEyeAcuity.visionAssessment && (
                  <Text style={styles.assessmentText}>{visionResults.leftEyeAcuity.visionAssessment}</Text>
                )}
                <Text style={styles.recommendationText}>{leftEyeRec.message}</Text>
              </View>
            )}

            {visionResults.rightEyeAcuity && rightEyeRec && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.eyeLabel}>Right Eye</Text>
                  <Text style={[styles.acuityScore, { color: rightEyeRec.color }]}>
                    {visionResults.rightEyeAcuity.distanceAcuity || visionResults.rightEyeAcuity.acuity}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: rightEyeRec.color + '20' }]}>
                  <Text style={[styles.statusText, { color: rightEyeRec.color }]}>
                    {rightEyeRec.status}
                  </Text>
                </View>
                {/* Near/Far Vision Assessment */}
                {visionResults.rightEyeAcuity.nearAcuity && (
                  <View style={styles.visionTypeContainer}>
                    <Text style={styles.visionTypeLabel}>
                      📏 Distance: {visionResults.rightEyeAcuity.distanceAcuity || visionResults.rightEyeAcuity.acuity}
                    </Text>
                    <Text style={styles.visionTypeLabel}>
                      📖 Near: {visionResults.rightEyeAcuity.nearAcuity}
                    </Text>
                  </View>
                )}
                {(visionResults.rightEyeAcuity.possibleMyopia || visionResults.rightEyeAcuity.possibleHyperopia) && (
                  <View style={styles.conditionContainer}>
                    {visionResults.rightEyeAcuity.possibleMyopia && (
                      <View style={[styles.conditionBadge, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={styles.conditionText}>🔍 Possible Nearsightedness</Text>
                      </View>
                    )}
                    {visionResults.rightEyeAcuity.possibleHyperopia && (
                      <View style={[styles.conditionBadge, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={styles.conditionText}>📖 Possible Farsightedness</Text>
                      </View>
                    )}
                  </View>
                )}
                {visionResults.rightEyeAcuity.visionAssessment && (
                  <Text style={styles.assessmentText}>{visionResults.rightEyeAcuity.visionAssessment}</Text>
                )}
                <Text style={styles.recommendationText}>{rightEyeRec.message}</Text>
              </View>
            )}
          </View>
        )}

        {/* Color Vision Results */}
        {visionResults?.colorVision && colorVisionRec && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Color Vision Results</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.eyeLabel}>Color Vision</Text>
                <Text style={[styles.statusText, { color: colorVisionRec.color }]}>
                  {colorVisionRec.status}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colorVisionRec.color + '20' }]}>
                <Text style={[styles.statusText, { color: colorVisionRec.color }]}>
                  Confidence: {visionResults.colorVision.confidence.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.recommendationText}>{colorVisionRec.message}</Text>
            </View>
          </View>
        )}

        {/* Astigmatism Results */}
        {visionResults?.astigmatism && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭕ Astigmatism Results</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.eyeLabel}>Astigmatism Screening</Text>
                <Text style={[
                  styles.statusText, 
                  { color: visionResults.astigmatism.hasAstigmatism 
                    ? (visionResults.astigmatism.severity === 'significant' ? '#F44336' : '#FF9800')
                    : '#4CAF50' 
                  }
                ]}>
                  {visionResults.astigmatism.hasAstigmatism 
                    ? `${visionResults.astigmatism.severity.charAt(0).toUpperCase() + visionResults.astigmatism.severity.slice(1)} Indicators`
                    : 'None Detected'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: visionResults.astigmatism.hasAstigmatism 
                  ? (visionResults.astigmatism.severity === 'significant' ? '#FFEBEE' : '#FFF3E0')
                  : '#E8F5E9' 
                }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: visionResults.astigmatism.hasAstigmatism 
                    ? (visionResults.astigmatism.severity === 'significant' ? '#F44336' : '#FF9800')
                    : '#4CAF50' 
                  }
                ]}>
                  {visionResults.astigmatism.hasAstigmatism 
                    ? `Affected axes: ${visionResults.astigmatism.affectedAxes.length}`
                    : 'All lines appear equal'}
                </Text>
              </View>
              <Text style={styles.recommendationText}>{visionResults.astigmatism.recommendation}</Text>
            </View>
          </View>
        )}

        {/* Eye Photo Analysis Results */}
        {eyePhotoResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Eye Photo Analysis</Text>
            
            {/* Eye Photos Preview */}
            <View style={styles.photoPreviewContainer}>
              {eyePhotoResults.leftEye && (
                <View style={styles.photoPreview}>
                  <Image 
                    source={{ uri: eyePhotoResults.leftEye.uri }} 
                    style={styles.eyePhoto} 
                  />
                  <Text style={styles.photoLabel}>Left Eye</Text>
                  <Text style={[
                    styles.photoScore,
                    { color: eyePhotoResults.leftEye.analysis.healthScore >= 70 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    Score: {eyePhotoResults.leftEye.analysis.healthScore}/100
                  </Text>
                </View>
              )}
              {eyePhotoResults.rightEye && (
                <View style={styles.photoPreview}>
                  <Image 
                    source={{ uri: eyePhotoResults.rightEye.uri }} 
                    style={styles.eyePhoto} 
                  />
                  <Text style={styles.photoLabel}>Right Eye</Text>
                  <Text style={[
                    styles.photoScore,
                    { color: eyePhotoResults.rightEye.analysis.healthScore >= 70 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    Score: {eyePhotoResults.rightEye.analysis.healthScore}/100
                  </Text>
                </View>
              )}
            </View>

            {/* Overall Assessment */}
            <View style={styles.assessmentCard}>
              <Text style={styles.assessmentTitle}>AI Assessment</Text>
              <Text style={styles.assessmentText}>{eyePhotoResults.overallAssessment}</Text>
            </View>

            {/* Recommendations */}
            {eyePhotoResults.recommendations.length > 0 && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.recommendationsTitle}>💡 Recommendations</Text>
                {eyePhotoResults.recommendations.slice(0, 4).map((rec, index) => (
                  <Text key={index} style={styles.recommendationItem}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Overall Recommendation */}
        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>
            {needsProfessionalCare ? '⚠️ Recommendation' : '✅ Great News!'}
          </Text>
          <Text style={styles.recommendationDescription}>
            {needsProfessionalCare
              ? 'Based on your screening results, we recommend scheduling an appointment with an eye care professional for a comprehensive examination.'
              : 'Your screening results look good! Continue with regular eye check-ups to maintain healthy vision.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {needsProfessionalCare && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/clinics')}
            >
              <Text style={styles.primaryButtonText}>Find Nearby Clinics</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.secondaryButtonText}>View Test History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This is a screening tool, not a medical diagnosis. 
            Always consult with a qualified eye care professional for accurate diagnosis and treatment.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eyeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  acuityScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    lineHeight: 22,
  },
  accuracyText: {
    fontSize: 14,
    color: '#999',
  },
  recommendationSection: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  recommendationDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
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
  secondaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  tertiaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  // Eye Photo Analysis Styles
  photoPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  photoPreview: {
    alignItems: 'center',
  },
  eyePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#9C27B0',
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  photoScore: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  assessmentCard: {
    backgroundColor: '#F3E5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  assessmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 10,
  },
  assessmentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 6,
  },
  // New styles for myopia/hyperopia display
  visionTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  visionTypeLabel: {
    fontSize: 14,
    color: '#555',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conditionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
});
