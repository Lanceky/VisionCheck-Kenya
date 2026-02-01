import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AstigmatismTest, { AstigmatismResult } from './AstigmatismTest';
import ColorVisionTest, { ColorVisionResult } from './ColorVisionTest';
import VisualAcuityTest, { VisualAcuityResult } from './VisualAcuityTest';

export type TestType = 'visual-acuity' | 'color-vision' | 'astigmatism' | 'complete';

interface VisionTestSuiteProps {
  testType?: TestType;
  onComplete: (results: VisionTestResults) => void;
  onCancel?: () => void;
}

export interface VisionTestResults {
  leftEyeAcuity?: VisualAcuityResult;
  rightEyeAcuity?: VisualAcuityResult;
  colorVision?: ColorVisionResult;
  astigmatism?: AstigmatismResult;
  completedAt: Date;
  duration?: number; // in seconds
}

export const VisionTestSuite: React.FC<VisionTestSuiteProps> = ({
  testType = 'complete',
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<
    'welcome' | 'left-eye' | 'right-eye' | 'color-vision' | 'astigmatism' | 'complete'
  >('welcome');
  const [startTime] = useState(new Date());
  const [results, setResults] = useState<Partial<VisionTestResults>>({});

  const handleLeftEyeComplete = (result: VisualAcuityResult) => {
    setResults((prev) => ({ ...prev, leftEyeAcuity: result }));
    
    if (testType === 'visual-acuity') {
      setCurrentStep('right-eye');
    } else {
      setCurrentStep('right-eye');
    }
  };

  const handleRightEyeComplete = (result: VisualAcuityResult) => {
    setResults((prev) => ({ ...prev, rightEyeAcuity: result }));
    
    if (testType === 'complete') {
      setCurrentStep('color-vision');
    } else {
      finishTests({ rightEyeAcuity: result });
    }
  };

  const handleColorVisionComplete = (result: ColorVisionResult) => {
    setResults((prev) => ({ ...prev, colorVision: result }));
    
    if (testType === 'complete') {
      setCurrentStep('astigmatism');
    } else {
      finishTests({ colorVision: result });
    }
  };

  const handleAstigmatismComplete = (result: AstigmatismResult) => {
    const finalResults: VisionTestResults = {
      ...results,
      astigmatism: result,
      completedAt: new Date(),
      duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
    };
    
    setCurrentStep('complete');
    onComplete(finalResults);
  };

  const finishTests = (additionalResults?: Partial<VisionTestResults>) => {
    const finalResults: VisionTestResults = {
      ...results,
      ...additionalResults,
      completedAt: new Date(),
      duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
    };
    
    setCurrentStep('complete');
    onComplete(finalResults);
  };

  const renderWelcome = () => (
    <ScrollView contentContainerStyle={styles.welcomeContainer}>
      <Text style={styles.welcomeTitle}>👁️ Vision Screening Test</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What to Expect:</Text>
        {testType === 'complete' && (
          <>
            <Text style={styles.infoText}>✓ Left Eye Visual Acuity Test (2-3 min)</Text>
            <Text style={styles.infoText}>✓ Right Eye Visual Acuity Test (2-3 min)</Text>
            <Text style={styles.infoText}>✓ Color Vision Test (1-2 min)</Text>
            <Text style={styles.infoText}>✓ Astigmatism Test (1-2 min)</Text>
            <Text style={styles.infoText}>
              📊 Total time: ~7-10 minutes
            </Text>
          </>
        )}
        {testType === 'visual-acuity' && (
          <>
            <Text style={styles.infoText}>✓ Left Eye Test (2-3 min)</Text>
            <Text style={styles.infoText}>✓ Right Eye Test (2-3 min)</Text>
            <Text style={styles.infoText}>
              📊 Total time: ~5 minutes
            </Text>
          </>
        )}
        {testType === 'color-vision' && (
          <>
            <Text style={styles.infoText}>✓ Color Plate Recognition (2-3 min)</Text>
          </>
        )}
        {testType === 'astigmatism' && (
          <>
            <Text style={styles.infoText}>✓ Astigmatism Dial Test (1-2 min)</Text>
          </>
        )}
      </View>

      <View style={styles.preparationCard}>
        <Text style={styles.preparationTitle}>Before You Start:</Text>
        <Text style={styles.preparationText}>
          ✓ Find a quiet, well-lit space
        </Text>
        <Text style={styles.preparationText}>
          ✓ Remove glasses or contacts (if testing without correction)
        </Text>
        <Text style={styles.preparationText}>
          ✓ Ensure your phone brightness is at maximum
        </Text>
        <Text style={styles.preparationText}>
          ✓ You'll need to be able to hold your phone at arm's length
        </Text>
      </View>

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          ⚠️ <Text style={styles.disclaimerBold}>Important:</Text> This is a screening 
          tool, not a medical diagnosis. If you have concerns about your vision, 
          please consult a qualified eye care professional.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            if (testType === 'color-vision') {
              setCurrentStep('color-vision');
            } else if (testType === 'astigmatism') {
              setCurrentStep('astigmatism');
            } else {
              setCurrentStep('left-eye');
            }
          }}
        >
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  if (currentStep === 'welcome') {
    return renderWelcome();
  }

  if (currentStep === 'left-eye') {
    return (
      <VisualAcuityTest
        eye="left"
        testType="snellen"
        onTestComplete={handleLeftEyeComplete}
      />
    );
  }

  if (currentStep === 'right-eye') {
    return (
      <VisualAcuityTest
        eye="right"
        testType="snellen"
        onTestComplete={handleRightEyeComplete}
      />
    );
  }

  if (currentStep === 'color-vision') {
    return <ColorVisionTest onTestComplete={handleColorVisionComplete} />;
  }

  if (currentStep === 'astigmatism') {
    return <AstigmatismTest onTestComplete={handleAstigmatismComplete} />;
  }

  return null;
};

const styles = StyleSheet.create({
  welcomeContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    lineHeight: 24,
  },
  preparationCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  preparationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
  },
  preparationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  disclaimerCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  disclaimerBold: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 15,
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VisionTestSuite;
