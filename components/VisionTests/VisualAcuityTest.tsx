import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

// Snellen chart optotypes (letters) with decreasing sizes for DISTANCE vision (tests nearsightedness/myopia)
// Using 6/x metric scale (standard in Kenya and most countries outside USA)
const SNELLEN_CHART = [
  { line: 1, letters: ['E'], size: 80, distance: '6/60' },
  { line: 2, letters: ['F', 'P'], size: 60, distance: '6/36' },
  { line: 3, letters: ['T', 'O', 'Z'], size: 48, distance: '6/24' },
  { line: 4, letters: ['L', 'P', 'E', 'D'], size: 36, distance: '6/18' },
  { line: 5, letters: ['P', 'E', 'C', 'F', 'D'], size: 28, distance: '6/12' },
  { line: 6, letters: ['E', 'D', 'F', 'C', 'Z', 'P'], size: 22, distance: '6/9' },
  { line: 7, letters: ['F', 'E', 'L', 'O', 'P', 'Z', 'D'], size: 18, distance: '6/7.5' },
  { line: 8, letters: ['D', 'E', 'F', 'P', 'O', 'T', 'E', 'C'], size: 14, distance: '6/6' },
];

// Near vision chart for testing farsightedness (hyperopia) - Jaeger scale
const NEAR_VISION_CHART = [
  { line: 1, text: 'The quick brown fox', size: 8, jaeger: 'J10' },
  { line: 2, text: 'jumps over the lazy', size: 10, jaeger: 'J7' },
  { line: 3, text: 'dog and runs away', size: 12, jaeger: 'J5' },
  { line: 4, text: 'into the forest', size: 14, jaeger: 'J3' },
  { line: 5, text: 'at night', size: 16, jaeger: 'J1' },
];

// Tumbling E directions
type Direction = 'up' | 'down' | 'left' | 'right';

const TUMBLING_E_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

interface VisualAcuityTestProps {
  eye: 'left' | 'right';
  onTestComplete: (result: VisualAcuityResult) => void;
  testType?: 'snellen' | 'tumbling-e';
}

export interface VisualAcuityResult {
  eye: 'left' | 'right';
  distanceAcuity: string; // e.g., "6/6", "6/12" - for distance vision (metric scale)
  nearAcuity: string; // e.g., "J1", "J3" - for near vision
  acuity: string; // legacy - same as distanceAcuity for backwards compatibility
  correctAnswers: number;
  totalQuestions: number;
  testType: 'snellen' | 'tumbling-e';
  timestamp: Date;
  // Vision condition indicators
  possibleMyopia: boolean; // Nearsightedness - difficulty seeing far
  possibleHyperopia: boolean; // Farsightedness - difficulty seeing near
  visionAssessment: string; // Human-readable assessment
}

export const VisualAcuityTest: React.FC<VisualAcuityTestProps> = ({
  eye,
  onTestComplete,
  testType = 'snellen',
}) => {
  // Test phase: 'distance' for far vision (myopia check), 'near' for near vision (hyperopia check)
  const [testPhase, setTestPhase] = useState<'distance' | 'near'>('distance');
  const [currentLine, setCurrentLine] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentDirection, setCurrentDirection] = useState<Direction>('up');
  
  // Store results from each phase
  const [distanceResult, setDistanceResult] = useState<string>('6/60');
  const [nearResult, setNearResult] = useState<string>('J10');
  const [nearCurrentLine, setNearCurrentLine] = useState(0);

  const currentLineData = testPhase === 'distance' 
    ? SNELLEN_CHART[currentLine] 
    : null;
  const currentLetter = currentLineData?.letters[currentLetterIndex];
  const currentNearLine = NEAR_VISION_CHART[nearCurrentLine];

  const startTest = () => {
    setShowInstructions(false);
    setIsTestActive(true);
    setTestPhase('distance');
    
    if (testType === 'tumbling-e') {
      generateRandomDirection();
    }
  };

  const generateRandomDirection = () => {
    const randomDir = TUMBLING_E_DIRECTIONS[
      Math.floor(Math.random() * TUMBLING_E_DIRECTIONS.length)
    ];
    setCurrentDirection(randomDir);
  };

  const handleDistanceAnswer = (answer: string, isCorrect: boolean) => {
    const newTotal = totalQuestions + 1;
    const newCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
    
    setTotalQuestions(newTotal);
    setCorrectAnswers(newCorrect);

    // Move to next letter or line
    if (currentLetterIndex < currentLineData!.letters.length - 1) {
      setCurrentLetterIndex(currentLetterIndex + 1);
      if (testType === 'tumbling-e') {
        generateRandomDirection();
      }
    } else {
      // Check if user got at least 50% correct on this line
      const lineCorrect = (newCorrect / newTotal) >= 0.5;
      
      if (lineCorrect && currentLine < SNELLEN_CHART.length - 1) {
        // Move to next (smaller) line
        setCurrentLine(currentLine + 1);
        setCurrentLetterIndex(0);
        
        if (testType === 'tumbling-e') {
          generateRandomDirection();
        }
      } else {
        // Distance test complete - save result and move to near vision test
        const finalDistanceAcuity = lineCorrect 
          ? currentLineData!.distance 
          : SNELLEN_CHART[currentLine - 1]?.distance || '6/60';
        setDistanceResult(finalDistanceAcuity);
        
        // Transition to near vision test
        setTestPhase('near');
        setShowInstructions(true);
      }
    }
  };

  const handleNearVisionAnswer = (canRead: boolean) => {
    if (canRead) {
      // User can read this line, try smaller text
      if (nearCurrentLine < NEAR_VISION_CHART.length - 1) {
        setNearCurrentLine(nearCurrentLine + 1);
      } else {
        // Completed all near vision lines - excellent near vision
        const finalNearAcuity = NEAR_VISION_CHART[nearCurrentLine].jaeger;
        setNearResult(finalNearAcuity);
        completeAllTests(distanceResult, finalNearAcuity);
      }
    } else {
      // User cannot read this line
      const nearAcuity = nearCurrentLine > 0 
        ? NEAR_VISION_CHART[nearCurrentLine - 1].jaeger 
        : 'J10+';
      setNearResult(nearAcuity);
      completeAllTests(distanceResult, nearAcuity);
    }
  };

  const assessVision = (distanceAcuity: string, nearAcuity: string): { 
    possibleMyopia: boolean; 
    possibleHyperopia: boolean; 
    assessment: string;
  } => {
    // Parse distance acuity (e.g., "6/12" -> 12)
    const distanceDenom = parseFloat(distanceAcuity.split('/')[1]) || 6;
    
    // Determine myopia (nearsightedness) - poor distance vision
    // 6/12 or worse suggests myopia (equivalent to 20/40 in US scale)
    const possibleMyopia = distanceDenom > 9;
    
    // Determine hyperopia (farsightedness) - poor near vision
    // J1 is best, J10 is worst for near vision
    const jaegerNum = parseInt(nearAcuity.replace('J', '').replace('+', '')) || 10;
    const possibleHyperopia = jaegerNum >= 5; // J5 or worse suggests hyperopia
    
    let assessment = '';
    
    if (!possibleMyopia && !possibleHyperopia) {
      assessment = 'Your vision appears normal for both distance and near objects. Continue with regular eye check-ups.';
    } else if (possibleMyopia && possibleHyperopia) {
      assessment = 'You may have difficulty seeing both far and near objects clearly. This could indicate astigmatism or presbyopia. We recommend a comprehensive eye examination.';
    } else if (possibleMyopia) {
      assessment = `Your distance vision (${distanceAcuity}) suggests possible nearsightedness (myopia). You may see close objects clearly but have difficulty with distant objects. Consider consulting an eye care professional for corrective lenses.`;
    } else if (possibleHyperopia) {
      assessment = `Your near vision (${nearAcuity}) suggests possible farsightedness (hyperopia). You may see distant objects clearly but have difficulty with close-up tasks like reading. Consider consulting an eye care professional.`;
    }
    
    return { possibleMyopia, possibleHyperopia, assessment };
  };

  const startNearTest = () => {
    setShowInstructions(false);
  };

  const completeAllTests = (finalDistanceAcuity: string, finalNearAcuity: string) => {
    setIsTestActive(false);
    
    const visionAssessment = assessVision(finalDistanceAcuity, finalNearAcuity);
    
    const result: VisualAcuityResult = {
      eye,
      distanceAcuity: finalDistanceAcuity,
      nearAcuity: finalNearAcuity,
      acuity: finalDistanceAcuity, // Legacy compatibility
      correctAnswers,
      totalQuestions,
      testType,
      timestamp: new Date(),
      possibleMyopia: visionAssessment.possibleMyopia,
      possibleHyperopia: visionAssessment.possibleHyperopia,
      visionAssessment: visionAssessment.assessment,
    };
    onTestComplete(result);
  };

  const renderDistanceInstructions = () => (
    <ScrollView contentContainerStyle={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>
        {eye === 'left' ? 'Left Eye Test' : 'Right Eye Test'}
      </Text>
      <Text style={styles.phaseLabel}>📏 Distance Vision Test</Text>
      <Text style={styles.phaseDescription}>
        This tests for nearsightedness (myopia) - difficulty seeing far away
      </Text>
      
      <View style={styles.distanceGuideContainer}>
        <Text style={styles.distanceGuideTitle}>📍 Positioning Guide:</Text>
        <Text style={styles.distanceGuideText}>
          • Start at arm's length (~1 metre)
        </Text>
        <Text style={styles.distanceGuideText}>
          • Move back incrementally as lines get smaller
        </Text>
        <Text style={styles.distanceGuideText}>
          • Ideal distance: 3 metres (10 feet) if possible
        </Text>
      </View>
      
      <Text style={styles.instructionsText}>
        {eye === 'left'
          ? 'Cover your RIGHT eye with your hand'
          : 'Cover your LEFT eye with your hand'}
      </Text>
      <Text style={styles.instructionsText}>
        {testType === 'snellen'
          ? 'Read the letters displayed and select the correct answer'
          : 'Identify the direction the "E" is pointing'}
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={startTest}>
        <Text style={styles.startButtonText}>Start Distance Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderNearInstructions = () => (
    <ScrollView contentContainerStyle={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>
        {eye === 'left' ? 'Left Eye' : 'Right Eye'} - Part 2
      </Text>
      <Text style={styles.phaseLabel}>📖 Near Vision Test</Text>
      <Text style={styles.phaseDescription}>
        This tests for farsightedness (hyperopia) - difficulty seeing up close
      </Text>
      
      <View style={styles.distanceGuideContainer}>
        <Text style={styles.distanceGuideTitle}>📍 Positioning Guide:</Text>
        <Text style={styles.distanceGuideText}>
          • Hold phone at reading distance (~35 cm / 14 inches)
        </Text>
        <Text style={styles.distanceGuideText}>
          • Keep covering your {eye === 'left' ? 'right' : 'left'} eye
        </Text>
      </View>
      
      <Text style={styles.instructionsText}>
        You'll be shown text of decreasing sizes. Tap "Yes" if you can read it clearly, "No" if it's blurry.
      </Text>
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={startNearTest}
      >
        <Text style={styles.startButtonText}>Start Near Vision Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderInstructions = () => {
    if (testPhase === 'distance') {
      return renderDistanceInstructions();
    }
    return renderNearInstructions();
  };

  const renderSnellenTest = () => {
    if (!currentLineData) return null;
    
    return (
      <View style={styles.testContainer}>
        <View style={styles.chartContainer}>
          <Text style={[styles.optotype, { fontSize: currentLineData.size }]}>
            {currentLetter}
          </Text>
          <Text style={styles.distanceLabel}>{currentLineData.distance}</Text>
        </View>

        <View style={styles.answerContainer}>
          <Text style={styles.questionText}>What letter do you see?</Text>
          <View style={styles.optionsGrid}>
            {['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'C', 'D'].map((letter) => (
              <TouchableOpacity
                key={letter}
                style={styles.optionButton}
                onPress={() => handleDistanceAnswer(letter, letter === currentLetter)}
              >
                <Text style={styles.optionText}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTumblingE = () => {
    if (!currentLineData) return null;
    
    const rotation =
      currentDirection === 'up'
        ? 0
        : currentDirection === 'right'
        ? 90
        : currentDirection === 'down'
        ? 180
        : 270;

    return (
      <View style={styles.testContainer}>
        <View style={styles.chartContainer}>
          <Text
            style={[
              styles.optotype,
              { fontSize: currentLineData.size, transform: [{ rotate: `${rotation}deg` }] },
            ]}
          >
            E
          </Text>
          <Text style={styles.distanceLabel}>{currentLineData.distance}</Text>
        </View>

        <View style={styles.answerContainer}>
          <Text style={styles.questionText}>Which direction is the E pointing?</Text>
          <View style={styles.directionGrid}>
            {TUMBLING_E_DIRECTIONS.map((dir) => (
              <TouchableOpacity
                key={dir}
                style={styles.directionButton}
                onPress={() => handleDistanceAnswer(dir, dir === currentDirection)}
              >
                <Text style={styles.directionText}>
                  {dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→'}
                </Text>
                <Text style={styles.directionLabel}>{dir.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderNearVisionTest = () => {
    if (!currentNearLine) return null;
    
    return (
      <View style={styles.testContainer}>
        <View style={styles.chartContainer}>
          <Text style={[styles.nearText, { fontSize: currentNearLine.size }]}>
            {currentNearLine.text}
          </Text>
          <Text style={styles.distanceLabel}>
            Near Vision: {currentNearLine.jaeger}
          </Text>
        </View>

        <View style={styles.answerContainer}>
          <Text style={styles.questionText}>Can you read this text clearly?</Text>
          <Text style={styles.hintText}>
            (Hold phone at normal reading distance - about 14 inches / 35 cm)
          </Text>
          <View style={styles.yesNoContainer}>
            <TouchableOpacity
              style={[styles.yesNoButton, styles.yesButton]}
              onPress={() => handleNearVisionAnswer(true)}
            >
              <Text style={styles.yesNoText}>✓ Yes, clearly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoButton, styles.noButton]}
              onPress={() => handleNearVisionAnswer(false)}
            >
              <Text style={styles.yesNoText}>✗ No, it's blurry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (showInstructions) {
    return renderInstructions();
  }

  // Render based on current test phase
  if (testPhase === 'near') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyeLabel}>
            Testing: {eye === 'left' ? 'Left Eye' : 'Right Eye'}
          </Text>
          <Text style={styles.phaseIndicator}>📖 Near Vision Test</Text>
          <Text style={styles.progressText}>
            Reading size {nearCurrentLine + 1} of {NEAR_VISION_CHART.length}
          </Text>
        </View>
        {renderNearVisionTest()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyeLabel}>
          Testing: {eye === 'left' ? 'Left Eye' : 'Right Eye'}
        </Text>
        <Text style={styles.phaseIndicator}>📏 Distance Vision Test</Text>
        <Text style={styles.progressText}>
          Line {currentLine + 1} of {SNELLEN_CHART.length}
        </Text>
      </View>
      {testType === 'snellen' ? renderSnellenTest() : renderTumblingE()}
    </View>
  );
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
  eyeLabel: {
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  instructionsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testContainer: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optotype: {
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },
  distanceLabel: {
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  answerContainer: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  optionButton: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  directionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  directionButton: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  directionText: {
    fontSize: 36,
    color: '#2196F3',
  },
  directionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  // New styles for near/far vision tests
  phaseLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  phaseIndicator: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  nearText: {
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#FF5722',
  },
  yesNoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  distanceGuideContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  distanceGuideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
  },
  distanceGuideText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});

export default VisualAcuityTest;
