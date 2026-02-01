import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AstigmatismTestProps {
  onTestComplete: (result: AstigmatismResult) => void;
}

export interface AstigmatismResult {
  hasAstigmatism: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'significant';
  affectedAxes: number[]; // Clock positions (1-12) that appear different
  timestamp: Date;
  recommendation: string;
}

// Clock positions for the astigmatism dial (like spokes on a wheel)
const CLOCK_POSITIONS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const AstigmatismTest: React.FC<AstigmatismTestProps> = ({ onTestComplete }) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [testPhase, setTestPhase] = useState<'clarity' | 'selection'>('clarity');
  const [allLinesSame, setAllLinesSame] = useState<boolean | null>(null);
  const [selectedDifferentLines, setSelectedDifferentLines] = useState<number[]>([]);

  const startTest = () => {
    setShowInstructions(false);
    setTestPhase('clarity');
  };

  const handleClarityAnswer = (same: boolean) => {
    setAllLinesSame(same);
    if (same) {
      // All lines appear the same - no astigmatism detected
      completeTest(false, []);
    } else {
      // Lines appear different - proceed to selection
      setTestPhase('selection');
    }
  };

  const toggleLineSelection = (position: number) => {
    setSelectedDifferentLines(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position);
      } else {
        return [...prev, position];
      }
    });
  };

  const completeTest = (hasAstigmatism: boolean, affectedAxes: number[]) => {
    // Determine severity based on number of affected axes and their pattern
    let severity: 'none' | 'mild' | 'moderate' | 'significant' = 'none';
    let recommendation = '';

    if (!hasAstigmatism || affectedAxes.length === 0) {
      severity = 'none';
      recommendation = 'No signs of astigmatism detected. All lines appear equally clear.';
    } else if (affectedAxes.length <= 2) {
      severity = 'mild';
      recommendation = 'Mild astigmatism may be present. Consider a professional eye exam for confirmation.';
    } else if (affectedAxes.length <= 4) {
      severity = 'moderate';
      recommendation = 'Moderate astigmatism indicators detected. We recommend scheduling an eye exam with an optometrist.';
    } else {
      severity = 'significant';
      recommendation = 'Significant astigmatism indicators detected. Please consult an eye care professional for a comprehensive examination and possible corrective lenses.';
    }

    const result: AstigmatismResult = {
      hasAstigmatism,
      severity,
      affectedAxes,
      timestamp: new Date(),
      recommendation,
    };

    onTestComplete(result);
  };

  const handleSelectionComplete = () => {
    completeTest(true, selectedDifferentLines);
  };

  const renderInstructions = () => (
    <ScrollView contentContainerStyle={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>Astigmatism Test</Text>
      <Text style={styles.instructionsText}>
        This test checks for astigmatism - a common condition where the eye isn't perfectly round, causing blurred vision.
      </Text>

      <View style={styles.instructionBox}>
        <Text style={styles.instructionHeader}>📱 Instructions:</Text>
        <Text style={styles.instructionItem}>
          • Hold your phone at arm's length (~40 cm)
        </Text>
        <Text style={styles.instructionItem}>
          • If you wear glasses for distance, keep them on
        </Text>
        <Text style={styles.instructionItem}>
          • Cover one eye and look at the center of the dial
        </Text>
        <Text style={styles.instructionItem}>
          • Notice if all lines appear equally dark and sharp
        </Text>
        <Text style={styles.instructionItem}>
          • Some lines may appear darker, blurrier, or thicker
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ This is a screening tool. For accurate diagnosis, please consult an eye care professional.
        </Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startTest}>
        <Text style={styles.startButtonText}>Begin Test</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAstigmatismDial = () => (
    <View style={styles.dialContainer}>
      {/* Center dot */}
      <View style={styles.centerDot} />
      
      {/* Radiating lines like clock hands */}
      {CLOCK_POSITIONS.map((position) => {
        const angle = (position - 3) * 30; // Convert clock position to degrees (3 o'clock = 0°)
        const isSelected = selectedDifferentLines.includes(position);
        
        return (
          <TouchableOpacity
            key={position}
            style={[
              styles.dialLine,
              {
                transform: [
                  { rotate: `${angle}deg` },
                ],
              },
              testPhase === 'selection' && isSelected && styles.selectedLine,
            ]}
            onPress={() => testPhase === 'selection' && toggleLineSelection(position)}
            disabled={testPhase !== 'selection'}
          >
            <View style={[
              styles.lineInner,
              testPhase === 'selection' && isSelected && styles.selectedLineInner,
            ]} />
          </TouchableOpacity>
        );
      })}
      
      {/* Clock position labels for selection phase */}
      {testPhase === 'selection' && CLOCK_POSITIONS.map((position) => {
        const angle = ((position - 3) * 30) * (Math.PI / 180);
        const radius = 130;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const isSelected = selectedDifferentLines.includes(position);
        
        return (
          <TouchableOpacity
            key={`label-${position}`}
            style={[
              styles.positionLabel,
              {
                transform: [
                  { translateX: x },
                  { translateY: y },
                ],
              },
              isSelected && styles.selectedLabel,
            ]}
            onPress={() => toggleLineSelection(position)}
          >
            <Text style={[
              styles.positionLabelText,
              isSelected && styles.selectedLabelText,
            ]}>
              {position}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderClarityPhase = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Astigmatism Test</Text>
        <Text style={styles.subHeaderText}>Look at the center of the dial</Text>
      </View>

      <View style={styles.testArea}>
        {renderAstigmatismDial()}
        
        <Text style={styles.questionText}>
          Do all lines appear equally dark and sharp?
        </Text>
        <Text style={styles.hintText}>
          Focus on the center dot and observe if any lines look different
        </Text>
      </View>

      <View style={styles.answerContainer}>
        <TouchableOpacity
          style={[styles.answerButton, styles.yesButton]}
          onPress={() => handleClarityAnswer(true)}
        >
          <Text style={styles.answerButtonText}>✓ Yes, all lines look the same</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.answerButton, styles.noButton]}
          onPress={() => handleClarityAnswer(false)}
        >
          <Text style={styles.answerButtonText}>✗ No, some lines look different</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSelectionPhase = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Astigmatism Test</Text>
        <Text style={styles.subHeaderText}>Tap the lines that appear different</Text>
      </View>

      <View style={styles.testArea}>
        {renderAstigmatismDial()}
        
        <Text style={styles.questionText}>
          Which lines appear darker, blurrier, or thicker?
        </Text>
        <Text style={styles.hintText}>
          Tap on the lines or numbers that look different from the others
        </Text>
        
        {selectedDifferentLines.length > 0 && (
          <Text style={styles.selectedCount}>
            Selected: {selectedDifferentLines.sort((a, b) => a - b).join(', ')} o'clock
          </Text>
        )}
      </View>

      <View style={styles.answerContainer}>
        <TouchableOpacity
          style={[styles.completeButton, selectedDifferentLines.length === 0 && styles.disabledButton]}
          onPress={handleSelectionComplete}
          disabled={selectedDifferentLines.length === 0}
        >
          <Text style={styles.completeButtonText}>
            {selectedDifferentLines.length === 0 
              ? 'Select the different lines' 
              : `Complete Test (${selectedDifferentLines.length} selected)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showInstructions) {
    return renderInstructions();
  }

  if (testPhase === 'clarity') {
    return renderClarityPhase();
  }

  return renderSelectionPhase();
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
  subHeaderText: {
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
    color: '#9C27B0',
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
    backgroundColor: '#F3E5F5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
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
    backgroundColor: '#9C27B0',
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
  testArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  centerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    zIndex: 10,
  },
  dialLine: {
    position: 'absolute',
    width: 200,
    height: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineInner: {
    width: '100%',
    height: 3,
    backgroundColor: '#333',
  },
  selectedLine: {
    // Container style when selected
  },
  selectedLineInner: {
    backgroundColor: '#9C27B0',
    height: 5,
  },
  positionLabel: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedLabel: {
    backgroundColor: '#9C27B0',
    borderColor: '#7B1FA2',
  },
  positionLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedLabelText: {
    color: '#FFFFFF',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  selectedCount: {
    fontSize: 16,
    color: '#9C27B0',
    fontWeight: '600',
    marginTop: 15,
  },
  answerContainer: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  answerButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#FF9800',
  },
  answerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AstigmatismTest;
