import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Ishihara-inspired color vision test plates
// Each plate shows a number in contrasting colors
interface ColorPlate {
  id: number;
  backgroundColor: string;
  numberColor: string;
  correctAnswer: string;
  testFor: 'normal' | 'red-green' | 'blue-yellow';
  description: string;
}

const COLOR_PLATES: ColorPlate[] = [
  {
    id: 1,
    backgroundColor: '#8FBC8F', // Sage green background
    numberColor: '#CD5C5C',     // Indian red number (visible to normal, hidden to red-green blind)
    correctAnswer: '12',
    testFor: 'normal',
    description: 'Normal vision should see 12',
  },
  {
    id: 2,
    backgroundColor: '#DEB887', // Burlywood background
    numberColor: '#228B22',     // Forest green number
    correctAnswer: '8',
    testFor: 'red-green',
    description: 'Tests for red-green color blindness',
  },
  {
    id: 3,
    backgroundColor: '#D2B48C', // Tan background
    numberColor: '#6A5ACD',     // Slate blue number
    correctAnswer: '5',
    testFor: 'blue-yellow',
    description: 'Tests for blue-yellow color blindness',
  },
  {
    id: 4,
    backgroundColor: '#E6B0AA', // Light coral background
    numberColor: '#2E8B57',     // Sea green number
    correctAnswer: '3',
    testFor: 'red-green',
    description: 'Red-green deficiency may have difficulty',
  },
];

interface ColorVisionTestProps {
  onTestComplete: (result: ColorVisionResult) => void;
}

export interface ColorVisionResult {
  totalPlates: number;
  correctAnswers: number;
  incorrectPlates: number[];
  possibleDeficiency: 'none' | 'red-green' | 'blue-yellow' | 'severe';
  timestamp: Date;
  confidence: 'high' | 'medium' | 'low';
}

export const ColorVisionTest: React.FC<ColorVisionTestProps> = ({ onTestComplete }) => {
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [isTestActive, setIsTestActive] = useState(false);

  const currentPlate = COLOR_PLATES[currentPlateIndex];

  const startTest = () => {
    setShowInstructions(false);
    setIsTestActive(true);
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...userAnswers, [currentPlate.id]: answer };
    setUserAnswers(newAnswers);

    if (currentPlateIndex < COLOR_PLATES.length - 1) {
      setCurrentPlateIndex(currentPlateIndex + 1);
    } else {
      completeTest(newAnswers);
    }
  };

  const completeTest = (answers: { [key: number]: string }) => {
    setIsTestActive(false);

    let correctCount = 0;
    const incorrectPlates: number[] = [];
    let redGreenErrors = 0;
    let blueYellowErrors = 0;

    COLOR_PLATES.forEach((plate) => {
      const userAnswer = answers[plate.id];
      if (userAnswer === plate.correctAnswer) {
        correctCount++;
      } else {
        incorrectPlates.push(plate.id);
        if (plate.testFor === 'red-green') redGreenErrors++;
        if (plate.testFor === 'blue-yellow') blueYellowErrors++;
      }
    });

    // Determine type of deficiency (adjusted for 4 plates)
    let deficiency: 'none' | 'red-green' | 'blue-yellow' | 'severe' = 'none';
    let confidence: 'high' | 'medium' | 'low' = 'high';

    if (incorrectPlates.length === 0) {
      deficiency = 'none';
      confidence = 'high';
    } else if (incorrectPlates.length >= 3) {
      deficiency = 'severe';
      confidence = 'high';
    } else if (redGreenErrors >= 2) {
      deficiency = 'red-green';
      confidence = 'medium';
    } else if (blueYellowErrors >= 1) {
      deficiency = 'blue-yellow';
      confidence = 'low';
    } else if (incorrectPlates.length > 0) {
      deficiency = 'none';
      confidence = 'low';
    }

    const result: ColorVisionResult = {
      totalPlates: COLOR_PLATES.length,
      correctAnswers: correctCount,
      incorrectPlates,
      possibleDeficiency: deficiency,
      timestamp: new Date(),
      confidence,
    };

    onTestComplete(result);
  };

  const renderInstructions = () => (
    <ScrollView contentContainerStyle={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>Color Vision Test</Text>
      <Text style={styles.instructionsText}>
        This test checks for color vision deficiencies (color blindness)
      </Text>
      
      <View style={styles.instructionBox}>
        <Text style={styles.instructionHeader}>📱 Instructions:</Text>
        <Text style={styles.instructionItem}>
          • Ensure you're in a well-lit room with natural lighting if possible
        </Text>
        <Text style={styles.instructionItem}>
          • Hold your phone at a comfortable reading distance
        </Text>
        <Text style={styles.instructionItem}>
          • Adjust screen brightness to maximum
        </Text>
        <Text style={styles.instructionItem}>
          • Look at each colored plate and identify the number you see
        </Text>
        <Text style={styles.instructionItem}>
          • If you don't see a number, select "No Number"
        </Text>
        <Text style={styles.instructionItem}>
          • Take your time, but answer based on your first impression
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Note: This is a screening tool, not a diagnostic test. 
          Consult an eye care professional for accurate diagnosis.
        </Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startTest}>
        <Text style={styles.startButtonText}>🎤 Begin Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderColorPlate = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Color Vision Test</Text>
        <Text style={styles.progressText}>
          Plate {currentPlateIndex + 1} of {COLOR_PLATES.length}
        </Text>
      </View>

      <View style={styles.plateContainer}>
        <Text style={styles.questionText}>What number do you see?</Text>
        
        {/* Color plate with number displayed as text */}
        <View style={[styles.colorPlate, { backgroundColor: currentPlate.backgroundColor }]}>
          <Text style={[styles.plateNumber, { color: currentPlate.numberColor }]}>
            {currentPlate.correctAnswer}
          </Text>
        </View>

        <Text style={styles.hintText}>Look at the center of the plate</Text>
      </View>

      <View style={styles.answerContainer}>
        <View style={styles.answerGrid}>
          {['12', '8', '5', '3'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.answerButton}
              onPress={() => handleAnswer(num)}
            >
              <Text style={styles.answerText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.answerButton, styles.noNumberButton]}
            onPress={() => handleAnswer('none')}
          >
            <Text style={[styles.answerText, styles.noNumberText]}>
              No Number
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (showInstructions) {
    return renderInstructions();
  }

  return renderColorPlate();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  instructionsContainer: {
    flexGrow: 1,
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 26,
  },
  instructionBox: {
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 15,
  },
  instructionItem: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginBottom: 30,
  },
  warningText: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  plateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
  },
  colorPlate: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  plateNumber: {
    fontSize: 120,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  answerContainer: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  answerButton: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  answerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  noNumberButton: {
    width: 150,
    borderColor: '#999',
  },
  noNumberText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ColorVisionTest;
