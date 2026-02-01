import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { aiService } from '../../lib/aiService';

export interface EyePhoto {
  uri: string;
  eye: 'left' | 'right';
  timestamp: Date;
}

export interface EyePhotoAnalysisResult {
  leftEye?: {
    uri: string;
    analysis: EyeAnalysis;
  };
  rightEye?: {
    uri: string;
    analysis: EyeAnalysis;
  };
  overallAssessment: string;
  recommendations: string[];
  requiresProfessionalReview: boolean;
  timestamp: Date;
}

export interface EyeAnalysis {
  healthScore: number; // 0-100
  observations: string[];
  concerns: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface EyePhotoCaptureProps {
  onCaptureComplete: (result: EyePhotoAnalysisResult) => void;
  onCancel?: () => void;
}

export const EyePhotoCapture: React.FC<EyePhotoCaptureProps> = ({
  onCaptureComplete,
  onCancel,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState<'instructions' | 'capture-left' | 'capture-right' | 'analyzing' | 'complete'>('instructions');
  const [leftEyePhoto, setLeftEyePhoto] = useState<string | null>(null);
  const [leftEyeBase64, setLeftEyeBase64] = useState<string | null>(null);
  const [rightEyePhoto, setRightEyePhoto] = useState<string | null>(null);
  const [rightEyeBase64, setRightEyeBase64] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    setIsApiConfigured(aiService.isConfigured());
  }, []);

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        if (currentStep === 'capture-left') {
          setLeftEyePhoto(photo.uri);
          setLeftEyeBase64(photo.base64 || null);
          setCurrentStep('capture-right');
        } else if (currentStep === 'capture-right') {
          setRightEyePhoto(photo.uri);
          setRightEyeBase64(photo.base64 || null);
          // Start analysis with both photos
          analyzePhotos(leftEyePhoto!, photo.uri, leftEyeBase64, photo.base64 || null);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const analyzePhotos = async (
    leftUri: string, 
    rightUri: string, 
    leftBase64: string | null, 
    rightBase64: string | null
  ) => {
    setCurrentStep('analyzing');
    setAnalysisProgress(0);
    setAnalysisStatus('Preparing photos for analysis...');

    // Check if API is configured
    if (!aiService.isConfigured()) {
      Alert.alert(
        'API Not Configured',
        'OpenAI API key is not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file to enable AI eye analysis.',
        [
          {
            text: 'OK',
            onPress: () => setCurrentStep('instructions'),
          },
        ]
      );
      return;
    }

    try {
      setAnalysisProgress(10);
      setAnalysisStatus('Analyzing left eye...');
      
      // Analyze with the AI service
      const result = await aiService.analyzeEyePhotos(
        leftBase64,
        rightBase64,
        leftUri,
        rightUri
      );

      setAnalysisProgress(100);
      setAnalysisStatus('Analysis complete!');

      setCurrentStep('complete');
      onCaptureComplete(result);
    } catch (error) {
      console.error('Error analyzing photos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Analysis Error', 
        `Failed to analyze photos: ${errorMessage}\n\nPlease check your internet connection and API key configuration.`,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setLeftEyePhoto(null);
              setLeftEyeBase64(null);
              setRightEyePhoto(null);
              setRightEyeBase64(null);
              setCurrentStep('instructions');
            },
          },
          {
            text: 'Cancel',
            onPress: onCancel,
            style: 'cancel',
          },
        ]
      );
    }
  };

  const retakePhoto = (eye: 'left' | 'right') => {
    if (eye === 'left') {
      setLeftEyePhoto(null);
      setLeftEyeBase64(null);
      setCurrentStep('capture-left');
    } else {
      setRightEyePhoto(null);
      setRightEyeBase64(null);
      setCurrentStep('capture-right');
    }
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to capture photos of your eyes for AI analysis.
          Your photos are processed securely and privately.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Skip This Step</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const renderInstructions = () => (
    <ScrollView contentContainerStyle={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>📸 Eye Photo Analysis</Text>
      <Text style={styles.instructionsSubtitle}>
        Capture photos of your eyes for AI-powered health screening
      </Text>

      {!isApiConfigured && (
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            OpenAI API key is not configured. Eye photo analysis will not work without it.
            Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.
          </Text>
        </View>
      )}

      <View style={styles.instructionBox}>
        <Text style={styles.instructionHeader}>How it works:</Text>
        <View style={styles.stepsList}>
          <Text style={styles.stepItem}>1️⃣ Position your face in good lighting</Text>
          <Text style={styles.stepItem}>2️⃣ Open your eye wide and look at the camera</Text>
          <Text style={styles.stepItem}>3️⃣ Capture your left eye photo</Text>
          <Text style={styles.stepItem}>4️⃣ Capture your right eye photo</Text>
          <Text style={styles.stepItem}>5️⃣ OpenAI Vision AI analyzes both photos</Text>
        </View>
      </View>

      <View style={styles.tipsBox}>
        <Text style={styles.tipsHeader}>📝 Tips for best results:</Text>
        <Text style={styles.tipItem}>• Use natural lighting or bright indoor light</Text>
        <Text style={styles.tipItem}>• Face the camera directly</Text>
        <Text style={styles.tipItem}>• Keep your eye open wide during capture</Text>
        <Text style={styles.tipItem}>• Remove glasses or contacts if possible</Text>
        <Text style={styles.tipItem}>• Hold the phone about 6-8 inches from your eye</Text>
      </View>

      <View style={styles.privacyBox}>
        <Text style={styles.privacyText}>
          🔒 Your photos are processed securely and are never shared with third parties.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => setCurrentStep('capture-left')}
      >
        <Text style={styles.startButtonText}>Start Eye Capture</Text>
      </TouchableOpacity>

      {onCancel && (
        <TouchableOpacity style={styles.skipButton} onPress={onCancel}>
          <Text style={styles.skipButtonText}>Skip This Test</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderCamera = () => {
    const isLeftEye = currentStep === 'capture-left';
    const eyeLabel = isLeftEye ? 'Left Eye' : 'Right Eye';

    return (
      <View style={styles.cameraContainer}>
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraTitle}>Capture {eyeLabel}</Text>
          <Text style={styles.cameraSubtitle}>
            {isLeftEye
              ? 'Position your LEFT eye in the circle'
              : 'Position your RIGHT eye in the circle'}
          </Text>
        </View>

        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.eyeGuide}>
                <View style={styles.eyeCircle} />
              </View>
              <Text style={styles.guideText}>
                👁️ Align your {isLeftEye ? 'left' : 'right'} eye here
              </Text>
            </View>
          </CameraView>
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          <Text style={styles.captureHint}>Tap to capture</Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotCompleted]} />
          <View style={styles.progressLine} />
          <View
            style={[
              styles.progressDot,
              currentStep === 'capture-right' && styles.progressDotActive,
              leftEyePhoto && styles.progressDotCompleted,
            ]}
          />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Left Eye</Text>
          <Text style={styles.progressLabel}>Right Eye</Text>
          <Text style={styles.progressLabel}>Analysis</Text>
        </View>
      </View>
    );
  };

  const renderAnalyzing = () => (
    <View style={styles.analyzingContainer}>
      <Text style={styles.analyzingIcon}>🔬</Text>
      <Text style={styles.analyzingTitle}>Analyzing Your Photos</Text>
      <Text style={styles.analyzingSubtitle}>
        OpenAI Vision is examining your eye photos for potential concerns...
      </Text>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${analysisProgress}%` }]} />
      </View>
      <Text style={styles.progressText}>{analysisProgress}%</Text>

      {analysisStatus ? (
        <Text style={styles.statusText}>{analysisStatus}</Text>
      ) : null}

      <View style={styles.analyzingSteps}>
        <Text style={[styles.analyzeStep, analysisProgress >= 10 && styles.analyzeStepComplete]}>
          ✓ Preparing images for AI analysis
        </Text>
        <Text style={[styles.analyzeStep, analysisProgress >= 30 && styles.analyzeStepComplete]}>
          ✓ Analyzing left eye with OpenAI Vision
        </Text>
        <Text style={[styles.analyzeStep, analysisProgress >= 60 && styles.analyzeStepComplete]}>
          ✓ Analyzing right eye with OpenAI Vision
        </Text>
        <Text style={[styles.analyzeStep, analysisProgress >= 80 && styles.analyzeStepComplete]}>
          ✓ Generating health assessment
        </Text>
        <Text style={[styles.analyzeStep, analysisProgress >= 100 && styles.analyzeStepComplete]}>
          ✓ Compiling recommendations
        </Text>
      </View>

      {/* Preview thumbnails */}
      <View style={styles.thumbnailContainer}>
        {leftEyePhoto && (
          <View style={styles.thumbnail}>
            <Image source={{ uri: leftEyePhoto }} style={styles.thumbnailImage} />
            <Text style={styles.thumbnailLabel}>Left Eye</Text>
          </View>
        )}
        {rightEyePhoto && (
          <View style={styles.thumbnail}>
            <Image source={{ uri: rightEyePhoto }} style={styles.thumbnailImage} />
            <Text style={styles.thumbnailLabel}>Right Eye</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (currentStep === 'instructions') {
    return renderInstructions();
  }

  if (currentStep === 'capture-left' || currentStep === 'capture-right') {
    return renderCamera();
  }

  if (currentStep === 'analyzing') {
    return renderAnalyzing();
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  permissionIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  instructionsContainer: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionsSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructionBox: {
    backgroundColor: '#F3E5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 15,
  },
  stepsList: {
    gap: 10,
  },
  stepItem: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFB74D',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  tipsBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  tipItem: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  privacyBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  privacyText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    backgroundColor: '#9C27B0',
    padding: 20,
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  cameraSubtitle: {
    fontSize: 16,
    color: '#E1BEE7',
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeGuide: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#9C27B0',
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cameraControls: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#1A1A1A',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#444',
  },
  progressDotActive: {
    backgroundColor: '#9C27B0',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: '#444',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
    backgroundColor: '#1A1A1A',
  },
  progressLabel: {
    color: '#999',
    fontSize: 12,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  analyzingIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  analyzingTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 10,
  },
  analyzingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  analyzingSteps: {
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  analyzeStep: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  analyzeStepComplete: {
    color: '#4CAF50',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  thumbnail: {
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#9C27B0',
  },
  thumbnailLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default EyePhotoCapture;
