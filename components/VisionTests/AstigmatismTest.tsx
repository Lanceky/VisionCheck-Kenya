import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

// ─── TYPES ───────────────────────────────────────────────────────────
type Eye = 'right' | 'left';
type TestPhase =
  | 'welcome'
  | 'setup'
  | 'test-instructions'
  | 'test'
  | 'confirm'
  | 'switch-eye'
  | 'results';

interface EyeAstigmatismResult {
  selectedAngles: number[];      // Angles the user said looked darker/clearer
  isUniform: boolean;            // True = all lines equally clear
  suspectedAxis: number | null;  // Estimated axis in degrees (perpendicular to darkest line)
  severity: 'none' | 'mild' | 'moderate' | 'significant';
  consistent: boolean;           // Was the repeat test consistent with the first?
}

interface TestResults {
  rightEye: EyeAstigmatismResult | null;
  leftEye: EyeAstigmatismResult | null;
  overallSuspicion: 'none' | 'mild' | 'moderate' | 'significant';
  recommendation: string;
}

interface Props {
  onComplete?: (results: TestResults) => void;
  onExit?: () => void;
}

// ─── SCREEN DIMENSIONS ──────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dial should be large enough to see clearly but fit comfortably
// Target ~5–7 cm on screen. On most phones, width - 64 achieves this.
const DIAL_SIZE = Math.min(SCREEN_WIDTH - 48, 360);

// ─── ASTIGMATIC DIAL CONFIGURATION ──────────────────────────────────
//
// Clinical standard: 12 lines at every 15°, radiating from center
// like a clock face (0°, 15°, 30°, ... 165°).
//
// Key requirements (ISO 8596 / optometric guidelines):
// - High contrast: black lines on white background
// - Equal line thickness in all directions
// - Precise angles: every 15° (12 meridians)
// - Center fixation dot
// - Lines must be identical in weight, length, and opacity

const NUM_LINES = 12;
const ANGLE_STEP = 180 / NUM_LINES; // 15° per line
const LINE_ANGLES = Array.from({ length: NUM_LINES }, (_, i) => i * ANGLE_STEP);

// Clock-position labels for user-friendly display
const CLOCK_LABELS: Record<number, string> = {
  0: '12–6',
  15: '1–7',
  30: '2–8',
  45: '3–9',
  60: '4–10',
  75: '5–11',
  90: '12–6', // wraps — but we use 0–165 range
  105: '1–7',
  120: '2–8',
  135: '3–9',
  150: '4–10',
  165: '5–11',
};

// Descriptive clock position for results
const getClockDescription = (angle: number): string => {
  // Each 15° maps to a clock position pair
  const positions = [
    '12 o\'clock – 6 o\'clock',    // 0°
    '1 o\'clock – 7 o\'clock',     // 15°
    '2 o\'clock – 8 o\'clock',     // 30°
    '3 o\'clock – 9 o\'clock',     // 45°
    '4 o\'clock – 10 o\'clock',    // 60°
    '5 o\'clock – 11 o\'clock',    // 75°
    '6 o\'clock – 12 o\'clock',    // 90°
    '7 o\'clock – 1 o\'clock',     // 105°
    '8 o\'clock – 2 o\'clock',     // 120°
    '9 o\'clock – 3 o\'clock',     // 135°
    '10 o\'clock – 4 o\'clock',    // 150°
    '11 o\'clock – 5 o\'clock',    // 165°
  ];
  const idx = Math.round(angle / 15) % 12;
  return positions[idx] || `${angle}°`;
};

// ─── INTERPRETATION LOGIC ───────────────────────────────────────────
//
// Astigmatism screening logic:
//   - All lines equally clear → no significant astigmatism
//   - One or two adjacent directions darker → likely astigmatism
//   - Two opposite directions darker → common astigmatism pattern
//   - Inconsistent repeat → uncertain, retest recommended
//
// The "axis" of astigmatism is PERPENDICULAR to the darkest meridian.
// E.g., if 3–9 o'clock (45°) line is darkest, axis ≈ 135°.
//
// Severity heuristic for screening:
//   - 0 selected → none
//   - 1 direction + consistent → mild
//   - 2 adjacent directions + consistent → moderate
//   - 3+ directions or very strong report → significant

const interpretEyeResult = (
  firstPass: number[],
  secondPass: number[],
): EyeAstigmatismResult => {
  // All clear
  if (firstPass.length === 0) {
    return {
      selectedAngles: [],
      isUniform: true,
      suspectedAxis: null,
      severity: 'none',
      consistent: secondPass.length === 0,
    };
  }

  // Check consistency between first and repeat pass
  const consistent = checkConsistency(firstPass, secondPass);

  // Determine suspected axis (perpendicular to darkest line)
  // Use the average of selected angles
  const avgAngle = averageAngles(firstPass);
  const suspectedAxis = (avgAngle + 90) % 180;

  // Severity based on number of lines selected and consistency
  let severity: 'none' | 'mild' | 'moderate' | 'significant';
  if (firstPass.length === 1 && consistent) {
    severity = 'mild';
  } else if (firstPass.length <= 2 && consistent) {
    severity = 'moderate';
  } else if (firstPass.length >= 3 || !consistent) {
    severity = firstPass.length >= 3 ? 'significant' : 'mild';
  } else {
    severity = 'mild';
  }

  return {
    selectedAngles: firstPass,
    isUniform: false,
    suspectedAxis: Math.round(suspectedAxis),
    severity,
    consistent,
  };
};

const checkConsistency = (first: number[], second: number[]): boolean => {
  if (first.length === 0 && second.length === 0) return true;
  if (first.length === 0 || second.length === 0) return false;

  // Check if at least one angle from first pass appears in second pass (within ±15°)
  let matchCount = 0;
  for (const a of first) {
    for (const b of second) {
      const diff = Math.abs(a - b);
      const wrappedDiff = Math.min(diff, 180 - diff);
      if (wrappedDiff <= 15) {
        matchCount++;
        break;
      }
    }
  }
  return matchCount >= Math.min(first.length, second.length) * 0.5;
};

const averageAngles = (angles: number[]): number => {
  if (angles.length === 0) return 0;
  if (angles.length === 1) return angles[0];

  // Circular mean for angles in 0-180 range
  // Double them to 0-360 range, compute circular mean, then halve
  let sinSum = 0, cosSum = 0;
  for (const a of angles) {
    const rad = (a * 2 * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  let mean = Math.atan2(sinSum, cosSum) * 180 / Math.PI;
  if (mean < 0) mean += 360;
  return (mean / 2) % 180;
};

const getOverallSuspicion = (
  right: EyeAstigmatismResult | null,
  left: EyeAstigmatismResult | null,
): 'none' | 'mild' | 'moderate' | 'significant' => {
  const severityOrder = ['none', 'mild', 'moderate', 'significant'] as const;
  const rIdx = severityOrder.indexOf(right?.severity ?? 'none');
  const lIdx = severityOrder.indexOf(left?.severity ?? 'none');
  return severityOrder[Math.max(rIdx, lIdx)];
};

const getRecommendation = (
  overall: 'none' | 'mild' | 'moderate' | 'significant',
  right: EyeAstigmatismResult | null,
  left: EyeAstigmatismResult | null,
): string => {
  if (overall === 'none') {
    return 'No signs of astigmatism detected. Your vision appears to focus evenly in all directions. Continue routine eye checkups every 1–2 years.';
  }
  if (overall === 'mild') {
    const inconsistent = (right && !right.consistent) || (left && !left.consistent);
    if (inconsistent) {
      return 'Results were slightly inconsistent. This could be due to eye fatigue or testing conditions. Consider retesting after resting your eyes, or visit an eye care professional if you notice distorted or stretched vision.';
    }
    return 'Mild directional focus difference detected. This may indicate a small amount of astigmatism. While often not vision-affecting, consider an optometric examination if you experience headaches, eye strain, or difficulty with fine detail.';
  }
  if (overall === 'moderate') {
    return 'Moderate directional focus imbalance detected in one or both eyes. This is consistent with astigmatism that may benefit from corrective lenses. We recommend visiting an optometrist for a comprehensive refraction test with a Jackson Cross Cylinder to determine the exact prescription.';
  }
  // significant
  return 'Significant directional focus imbalance detected. This strongly suggests astigmatism that likely affects your daily vision. Please visit an eye care professional promptly for a full refraction assessment. Corrective glasses or contact lenses (toric lenses) can substantially improve your vision clarity.';
};

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function AstigmatismTest({ onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<TestPhase>('welcome');
  const [currentEye, setCurrentEye] = useState<Eye>('right');
  const [testRound, setTestRound] = useState<1 | 2>(1); // 1 = first pass, 2 = confirmation pass
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Selected angles for each eye, each round
  const [rightEyeRound1, setRightEyeRound1] = useState<number[]>([]);
  const [rightEyeRound2, setRightEyeRound2] = useState<number[]>([]);
  const [leftEyeRound1, setLeftEyeRound1] = useState<number[]>([]);
  const [leftEyeRound2, setLeftEyeRound2] = useState<number[]>([]);

  // Currently toggled angles in this round
  const [selectedAngles, setSelectedAngles] = useState<number[]>([]);

  // Final results
  const [rightResult, setRightResult] = useState<EyeAstigmatismResult | null>(null);
  const [leftResult, setLeftResult] = useState<EyeAstigmatismResult | null>(null);

  // ─── Animations ─────────────────────────────
  // Reset fade to fully visible whenever we enter the test phase
  useEffect(() => {
    if (phase === 'test') {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(1);
    }
  }, [phase, testRound]);

  const animateTransition = useCallback((callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 150);
  }, [fadeAnim]);

  // ─── System back button handling ─────────────
  const previousPhaseMap: Record<TestPhase, TestPhase | 'exit'> = {
    'welcome': 'exit',
    'setup': 'welcome',
    'test-instructions': 'setup',
    'test': 'test-instructions',
    'confirm': 'test',
    'switch-eye': 'test',
    'results': 'test',
  };

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      const prev = previousPhaseMap[phase];
      if (prev === 'exit') {
        onExit?.();
      } else {
        setPhase(prev);
      }
      return true;
    });
    return () => handler.remove();
  }, [phase]);

  // ─── Toggle a line angle ────────────────────
  const toggleAngle = (angle: number) => {
    setSelectedAngles(prev =>
      prev.includes(angle)
        ? prev.filter(a => a !== angle)
        : [...prev, angle]
    );
  };

  // ─── Submit current round ───────────────────
  const handleSubmitRound = () => {
    if (currentEye === 'right') {
      if (testRound === 1) {
        setRightEyeRound1([...selectedAngles]);
        // Start confirmation round
        setSelectedAngles([]);
        setTestRound(2);
        setPhase('confirm');
      } else {
        // Round 2 done for right eye
        setRightEyeRound2([...selectedAngles]);
        const result = interpretEyeResult(rightEyeRound1, [...selectedAngles]);
        setRightResult(result);

        // Move to left eye
        setSelectedAngles([]);
        setTestRound(1);
        setCurrentEye('left');
        setPhase('switch-eye');
      }
    } else {
      if (testRound === 1) {
        setLeftEyeRound1([...selectedAngles]);
        setSelectedAngles([]);
        setTestRound(2);
        setPhase('confirm');
      } else {
        // Round 2 done for left eye — finish test
        setLeftEyeRound2([...selectedAngles]);
        const result = interpretEyeResult(leftEyeRound1, [...selectedAngles]);
        setLeftResult(result);
        finishTest(rightResult!, result);
      }
    }
  };

  // ─── "All Lines Equal" shortcut ─────────────
  const handleAllEqual = () => {
    if (currentEye === 'right') {
      if (testRound === 1) {
        setRightEyeRound1([]);
        setSelectedAngles([]);
        setTestRound(2);
        setPhase('confirm');
      } else {
        setRightEyeRound2([]);
        const result = interpretEyeResult([], []);
        setRightResult(result);
        setSelectedAngles([]);
        setTestRound(1);
        setCurrentEye('left');
        setPhase('switch-eye');
      }
    } else {
      if (testRound === 1) {
        setLeftEyeRound1([]);
        setSelectedAngles([]);
        setTestRound(2);
        setPhase('confirm');
      } else {
        setLeftEyeRound2([]);
        const result = interpretEyeResult([], []);
        setLeftResult(result);
        finishTest(rightResult!, result);
      }
    }
  };

  // ─── Finish ─────────────────────────────────
  const finishTest = (right: EyeAstigmatismResult, left: EyeAstigmatismResult) => {
    const overall = getOverallSuspicion(right, left);
    const recommendation = getRecommendation(overall, right, left);

    const finalResults: TestResults = {
      rightEye: right,
      leftEye: left,
      overallSuspicion: overall,
      recommendation,
    };

    setPhase('results');
    onComplete?.(finalResults);
  };

  // ─── Compute results for display ────────────
  const getResults = (): TestResults => {
    const overall = getOverallSuspicion(rightResult, leftResult);
    const recommendation = getRecommendation(overall, rightResult, leftResult);
    return {
      rightEye: rightResult,
      leftEye: leftResult,
      overallSuspicion: overall,
      recommendation,
    };
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'none': return '#2E7D32';
      case 'mild': return '#F9A825';
      case 'moderate': return '#E65100';
      case 'significant': return '#C62828';
      default: return '#757575';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'none': return 'No Astigmatism Detected';
      case 'mild': return 'Mild Suspicion';
      case 'moderate': return 'Moderate Suspicion';
      case 'significant': return 'Significant Suspicion';
      default: return 'Unknown';
    }
  };

  const getResultEmoji = (severity: string): string => {
    return severity === 'none' ? '✅' : '⚠️';
  };

  // ─── RENDER: Astigmatic Dial SVG ───────────
  const renderDial = (interactive: boolean, highlightAngles: number[] = []) => {
    const center = DIAL_SIZE / 2;
    const radius = DIAL_SIZE / 2 - 16;
    const lineLength = radius * 0.85;
    const strokeWidth = 2.5;

    return (
      <View style={styles.dialWrapper}>
        <View style={styles.dialContainer}>
          <Svg width={DIAL_SIZE} height={DIAL_SIZE} viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}>
            {/* Background circle — very light gray for contrast */}
            <Circle
              cx={center}
              cy={center}
              r={radius + 8}
              fill="#FFFFFF"
              stroke="#E0E0E0"
              strokeWidth={1}
            />

            {/* Radiating lines */}
            {LINE_ANGLES.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = center + Math.cos(rad) * lineLength;
              const y1 = center - Math.sin(rad) * lineLength;
              const x2 = center - Math.cos(rad) * lineLength;
              const y2 = center + Math.sin(rad) * lineLength;

              const isHighlighted = highlightAngles.includes(angle);
              const isSelected = interactive && selectedAngles.includes(angle);

              return (
                <Line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isSelected ? '#00ACC1' : isHighlighted ? '#E65100' : '#212121'}
                  strokeWidth={isSelected ? strokeWidth + 1.5 : isHighlighted ? strokeWidth + 1 : strokeWidth}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Center fixation dot */}
            <Circle
              cx={center}
              cy={center}
              r={4}
              fill="#C62828"
            />
          </Svg>
        </View>

        {/* Interactive tap zones */}
        {interactive && (
          <View style={[styles.tapZoneOverlay, { width: DIAL_SIZE, height: DIAL_SIZE }]}>
            {LINE_ANGLES.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const isSelected = selectedAngles.includes(angle);

              // Place tap target at the end of each line
              const tapDist = radius * 0.65;
              const tapX = center + Math.cos(rad) * tapDist - 22;
              const tapY = center - Math.sin(rad) * tapDist - 22;

              // Also place one on the opposite end
              const tapX2 = center - Math.cos(rad) * tapDist - 22;
              const tapY2 = center + Math.sin(rad) * tapDist - 22;

              return (
                <React.Fragment key={angle}>
                  <TouchableOpacity
                    style={[
                      styles.tapZone,
                      { left: tapX, top: tapY },
                      isSelected && styles.tapZoneSelected,
                    ]}
                    onPress={() => toggleAngle(angle)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.tapZoneText,
                      isSelected && styles.tapZoneTextSelected,
                    ]}>
                      {Math.round(angle)}°
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tapZone,
                      { left: tapX2, top: tapY2 },
                      isSelected && styles.tapZoneSelected,
                    ]}
                    onPress={() => toggleAngle(angle)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.tapZoneText,
                      isSelected && styles.tapZoneTextSelected,
                    ]}>
                      {Math.round(angle)}°
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // ===== WELCOME SCREEN =====
  if (phase === 'welcome') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            {onExit && (
              <TouchableOpacity style={styles.backArrow} onPress={onExit}>
                <Text style={styles.backArrowText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerEmoji}>◎</Text>
            <Text style={styles.headerTitle}>Astigmatism Screening</Text>
            <Text style={styles.headerSubtitle}>Astigmatic Dial Test</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What Is Astigmatism?</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👁️</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Uneven Focus</Text>
                <Text style={styles.infoDesc}>
                  Astigmatism means the eye doesn't focus light evenly in all directions. Some angles appear sharper while others look blurry or distorted.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📐</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>How We Test</Text>
                <Text style={styles.infoDesc}>
                  You'll look at a dial with lines radiating in all directions, like a clock. If some lines look darker or clearer than others, it may indicate astigmatism.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>3–4 Minutes</Text>
                <Text style={styles.infoDesc}>
                  Each eye tested separately, with a confirmation round for accuracy. Quick and non-invasive.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clinical Standard</Text>
            <Text style={styles.bodyText}>
              Based on the Astigmatic Dial (Clock Dial) method — the most widely used clinical screening tool for astigmatism. Uses 12 equally-spaced meridian lines at 15° intervals.
            </Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                🔬 This is a screening tool that detects directional focus differences. It does NOT measure prescription power — only an optometrist with a Jackson Cross Cylinder can do that.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('setup')}>
            <Text style={styles.primaryBtnText}>Start Screening</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== SETUP SCREEN =====
  if (phase === 'setup') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <TouchableOpacity style={styles.backArrow} onPress={() => setPhase('welcome')}>
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>💡</Text>
            <Text style={styles.headerTitle}>Setup Instructions</Text>
            <Text style={styles.headerSubtitle}>Optimal Conditions for Accurate Results</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Environment Setup</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
              <Text style={styles.stepText}>
                Hold your phone at arm's length (~50–75 cm) or the same distance used for your visual acuity test
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
              <Text style={styles.stepText}>
                Set screen brightness to maximum — glare or dim screens can hide astigmatism
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
              <Text style={styles.stepText}>
                Ensure neutral indoor lighting — avoid direct sunlight or shadows on the screen
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>4</Text></View>
              <Text style={styles.stepText}>
                If you normally wear glasses for distance, wear them during the test
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Testing Procedure</Text>

            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: '#00838F' }]}>
                <Text style={styles.stepNumber}>👁️</Text>
              </View>
              <Text style={styles.stepText}>
                Cover your LEFT eye first. We'll test the RIGHT eye, then switch.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: '#00838F' }]}>
                <Text style={styles.stepNumber}>👆</Text>
              </View>
              <Text style={styles.stepText}>
                Look at the center red dot. Then tap any lines that appear darker, thicker, or clearer than the others.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: '#00838F' }]}>
                <Text style={styles.stepNumber}>✓</Text>
              </View>
              <Text style={styles.stepText}>
                If all lines look equally clear, tap "All Lines Equal". You'll be asked to confirm your answer once.
              </Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                ⚠️ Focus on the center dot, not on individual lines. Let your peripheral awareness judge which lines stand out. Don't squint — use your natural relaxed vision.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setCurrentEye('right');
              setTestRound(1);
              setSelectedAngles([]);
              setRightEyeRound1([]);
              setRightEyeRound2([]);
              setLeftEyeRound1([]);
              setLeftEyeRound2([]);
              setRightResult(null);
              setLeftResult(null);
              setPhase('test-instructions');
            }}
          >
            <Text style={styles.primaryBtnText}>Begin Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== TEST INSTRUCTIONS (per eye) =====
  if (phase === 'test-instructions') {
    const isRight = currentEye === 'right';
    return (
      <View style={styles.screenFlex}>
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>
            {isRight ? 'Right Eye (OD)' : 'Left Eye (OS)'}
          </Text>
          <Text style={styles.eyeBannerSub}>
            {isRight ? 'Cover your LEFT eye' : 'Cover your RIGHT eye'}
          </Text>
        </View>

        <View style={styles.instructionBody}>
          <View style={styles.coverEyeContainer}>
            <Text style={styles.coverEyeEmoji}>
              {isRight ? '🫣' : '🫣'}
            </Text>
            <Text style={styles.coverEyeTitle}>
              {isRight ? 'Cover Your Left Eye' : 'Cover Your Right Eye'}
            </Text>
            <Text style={styles.coverEyeDesc}>
              Use your palm or an occluder to gently cover your {isRight ? 'left' : 'right'} eye.
              Do not press on the eye — just block the vision.
            </Text>
          </View>

          <View style={styles.miniDialContainer}>
            {renderDial(false)}
          </View>

          <Text style={styles.instructionHint}>
            Focus on the red center dot.{'\n'}
            Tap any lines that look darker, thicker, or clearer.
          </Text>
        </View>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setSelectedAngles([]);
              setPhase('test');
            }}
          >
            <Text style={styles.primaryBtnText}>
              I'm Ready — Show the Dial
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== MAIN TEST SCREEN =====
  if (phase === 'test') {
    const isRight = currentEye === 'right';
    const roundLabel = testRound === 1 ? 'First Look' : 'Confirmation';
    const progress = currentEye === 'right'
      ? (testRound === 1 ? 25 : 50)
      : (testRound === 1 ? 75 : 95);

    return (
      <View style={[styles.screen, styles.testScreen]}>
        {/* Header */}
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>
            {isRight ? 'Right Eye (OD)' : 'Left Eye (OS)'} — {roundLabel}
          </Text>
          <Text style={styles.eyeBannerSub}>
            {isRight ? 'Left eye covered' : 'Right eye covered'}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Dial area */}
        <View style={styles.dialArea}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderDial(true)}
          </Animated.View>
        </View>

        {/* Bottom section */}
        <View style={styles.testBottomSection}>
          <Text style={styles.questionText}>
            {testRound === 1
              ? 'Tap any lines that appear darker or clearer'
              : 'Confirm: tap the darker/clearer lines again'
            }
          </Text>

          {selectedAngles.length > 0 && (
            <Text style={styles.selectedInfo}>
              {selectedAngles.length} line{selectedAngles.length !== 1 ? 's' : ''} selected: {selectedAngles.sort((a, b) => a - b).map(a => `${a}°`).join(', ')}
            </Text>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.equalBtn]}
              onPress={handleAllEqual}
            >
              <Text style={styles.equalBtnText}>All Lines Equal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                selectedAngles.length === 0 && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitRound}
              disabled={selectedAngles.length === 0}
            >
              <Text style={[
                styles.submitBtnText,
                selectedAngles.length === 0 && styles.submitBtnTextDisabled,
              ]}>
                {testRound === 1 ? 'Next →' : 'Confirm →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ===== CONFIRMATION PROMPT =====
  if (phase === 'confirm') {
    const isRight = currentEye === 'right';
    const firstPassAngles = isRight ? rightEyeRound1 : leftEyeRound1;

    return (
      <View style={styles.screenFlex}>
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>
            {isRight ? 'Right Eye (OD)' : 'Left Eye (OS)'} — Confirm
          </Text>
          <Text style={styles.eyeBannerSub}>Repeat the test for accuracy</Text>
        </View>

        <View style={styles.confirmBody}>
          <Text style={styles.confirmTitle}>Confirmation Round</Text>
          <Text style={styles.confirmDesc}>
            {firstPassAngles.length === 0
              ? 'You reported all lines looked equal. Let\'s verify — look at the dial again and confirm whether all lines truly appear the same.'
              : `You identified ${firstPassAngles.length} darker line${firstPassAngles.length !== 1 ? 's' : ''}. Now look at the dial again with fresh eyes and tell us what you see.`
            }
          </Text>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              💡 This repeat helps ensure accuracy. Blink a few times and refocus on the center dot before proceeding.
            </Text>
          </View>
        </View>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setSelectedAngles([]);
              setPhase('test');
            }}
          >
            <Text style={styles.primaryBtnText}>Show Dial Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== SWITCH EYE SCREEN =====
  if (phase === 'switch-eye') {
    return (
      <View style={styles.screenFlex}>
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>Right Eye Complete ✓</Text>
          <Text style={styles.eyeBannerSub}>Now testing the left eye</Text>
        </View>

        <View style={styles.switchBody}>
          <View style={styles.switchCard}>
            <Text style={styles.switchEmoji}>👁️</Text>
            <Text style={styles.switchTitle}>Switch Eyes</Text>
            <Text style={styles.switchDesc}>
              Now cover your RIGHT eye and keep your LEFT eye open.
            </Text>
            <Text style={styles.switchHint}>
              Take a moment to rest your eyes before continuing.
            </Text>
          </View>

          {rightResult && (
            <View style={styles.miniResultCard}>
              <Text style={styles.miniResultTitle}>Right Eye Result</Text>
              <Text style={[styles.miniResultText, { color: getSeverityColor(rightResult.severity) }]}>
                {rightResult.isUniform
                  ? 'All lines appeared equal — no astigmatism signs'
                  : `${rightResult.selectedAngles.length} direction${rightResult.selectedAngles.length !== 1 ? 's' : ''} appeared darker`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setSelectedAngles([]);
              setTestRound(1);
              setPhase('test-instructions');
            }}
          >
            <Text style={styles.primaryBtnText}>Test Left Eye</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== RESULTS SCREEN =====
  if (phase === 'results') {
    const results = getResults();
    const severityColor = getSeverityColor(results.overallSuspicion);
    const emoji = getResultEmoji(results.overallSuspicion);

    const renderEyeResult = (eye: 'right' | 'left', result: EyeAstigmatismResult | null) => {
      if (!result) return null;
      const eyeLabel = eye === 'right' ? 'Right Eye (OD)' : 'Left Eye (OS)';
      const color = getSeverityColor(result.severity);

      return (
        <View style={styles.eyeResultBlock}>
          <View style={styles.eyeResultHeader}>
            <Text style={styles.eyeResultLabel}>{eyeLabel}</Text>
            <Text style={[styles.eyeResultSeverity, { color }]}>
              {getSeverityLabel(result.severity)}
            </Text>
          </View>

          {result.isUniform ? (
            <Text style={styles.eyeResultDetail}>
              All lines appeared equally clear — no directional focus difference detected.
            </Text>
          ) : (
            <>
              <Text style={styles.eyeResultDetail}>
                Darker lines reported at: {result.selectedAngles.sort((a, b) => a - b).map(a => `${a}°`).join(', ')}
              </Text>
              {result.suspectedAxis !== null && (
                <Text style={styles.eyeResultDetail}>
                  Suspected astigmatic axis: ~{result.suspectedAxis}°
                </Text>
              )}
              <Text style={[styles.eyeResultConsistency, {
                color: result.consistent ? '#2E7D32' : '#E65100',
              }]}>
                {result.consistent ? '✓ Consistent across both rounds' : '⚠ Inconsistent between rounds — retest recommended'}
              </Text>
            </>
          )}
        </View>
      );
    };

    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={[styles.headerBanner, {
            backgroundColor: results.overallSuspicion === 'none' ? '#2E7D32' : '#E65100',
          }]}>
            {onExit && (
              <TouchableOpacity style={styles.backArrow} onPress={onExit}>
                <Text style={styles.backArrowText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerEmoji}>{emoji}</Text>
            <Text style={styles.headerTitle}>Astigmatism Results</Text>
            <Text style={styles.headerSubtitle}>Astigmatic Dial Screening</Text>
          </View>

          {/* Overall result */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Assessment</Text>
            <View style={styles.overallResultBox}>
              <View style={[styles.overallIndicator, { borderColor: severityColor }]}>
                <Text style={[styles.overallLabel, { color: severityColor }]}>
                  {getSeverityLabel(results.overallSuspicion)}
                </Text>
              </View>
            </View>
          </View>

          {/* Per-eye results */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Eye-by-Eye Results</Text>
            {renderEyeResult('right', results.rightEye)}
            <View style={styles.divider} />
            {renderEyeResult('left', results.leftEye)}
          </View>

          {/* Visual summary with highlighted dial */}
          {(results.rightEye && !results.rightEye.isUniform) || (results.leftEye && !results.leftEye.isUniform) ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Affected Meridians</Text>
              <Text style={styles.bodyText}>
                Lines that appeared darker are highlighted in orange below. The astigmatic axis is perpendicular to these lines.
              </Text>
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                {renderDial(
                  false,
                  [
                    ...(results.rightEye?.selectedAngles ?? []),
                    ...(results.leftEye?.selectedAngles ?? []),
                  ].filter((v, i, a) => a.indexOf(v) === i),
                )}
              </View>
            </View>
          ) : null}

          {/* Diagnosis & recommendation */}
          <View style={[styles.card, styles.diagnosisCard, { borderLeftColor: severityColor }]}>
            <Text style={styles.cardTitle}>
              {results.overallSuspicion === 'none' ? 'Assessment' : '⚠️ Assessment'}
            </Text>
            <Text style={styles.diagnosisText}>{results.recommendation}</Text>

            {results.overallSuspicion !== 'none' && (
              <>
                <View style={{ height: 12 }} />
                <Text style={styles.recommendTitle}>What This Means</Text>
                <Text style={styles.recommendText}>
                  Some lines on the dial appeared darker or clearer than others. This suggests the eye may not be focusing light equally in all directions. An optometrist can precisely measure the degree and axis of astigmatism and, if needed, prescribe cylindrical corrective lenses.
                </Text>
              </>
            )}
          </View>

          {/* Methodology */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Methodology</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Test Method</Text>
              <Text style={styles.summaryValue}>Astigmatic Dial</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Meridians Tested</Text>
              <Text style={styles.summaryValue}>12 (every 15°)</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Eyes Tested</Text>
              <Text style={styles.summaryValue}>Both (monocular)</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Confirmation</Text>
              <Text style={styles.summaryValue}>2 rounds per eye</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Standard</Text>
              <Text style={styles.summaryValue}>ISO 8596 principles</Text>
            </View>
          </View>

          {/* What this test cannot do */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Limitations</Text>
            <View style={styles.limitRow}>
              <Text style={styles.limitIcon}>❌</Text>
              <Text style={styles.limitText}>Cannot measure cylinder power (diopters)</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitIcon}>❌</Text>
              <Text style={styles.limitText}>Cannot prescribe corrective lenses</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitIcon}>❌</Text>
              <Text style={styles.limitText}>Cannot replace a clinical refraction test</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.limitRow}>
              <Text style={styles.limitIcon}>✅</Text>
              <Text style={styles.limitText}>Can reliably screen for astigmatism</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitIcon}>✅</Text>
              <Text style={styles.limitText}>Can flag patients needing referral</Text>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitIcon}>✅</Text>
              <Text style={styles.limitText}>Suitable for community & school screening</Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This is a screening tool, not a medical diagnosis. Smartphone screens, ambient lighting, and viewing distance can affect results. Consult a qualified eye care professional for definitive astigmatism assessment and prescription.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => onExit?.()}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              setCurrentEye('right');
              setTestRound(1);
              setSelectedAngles([]);
              setRightEyeRound1([]);
              setRightEyeRound2([]);
              setLeftEyeRound1([]);
              setLeftEyeRound2([]);
              setRightResult(null);
              setLeftResult(null);
              setPhase('test-instructions');
            }}
          >
            <Text style={styles.ghostBtnText}>Retake Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// ─── STYLES ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Screens ──
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  screenFlex: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  screenContent: {
    paddingBottom: 20,
  },
  testScreen: {
    paddingHorizontal: 0,
  },

  // ── Header Banner ──
  headerBanner: {
    backgroundColor: '#00ACC1',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backArrow: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backArrowText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Cards ──
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 14,
  },

  // ── Info Rows ──
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 14,
    marginTop: 2,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 3,
  },
  infoDesc: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },

  // ── Steps ──
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00ACC1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumber: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#424242',
    lineHeight: 21,
  },

  // ── Tip Box ──
  tipBox: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#00695C',
    lineHeight: 20,
  },

  // ── Eye Banner ──
  eyeBanner: {
    backgroundColor: '#00838F',
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 44,
  },
  eyeBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eyeBannerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // ── Progress ──
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#00ACC1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 6,
    textAlign: 'right',
  },

  // ── Dial Display ──
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dialArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // ── Tap Zones ──
  tapZoneOverlay: {
    position: 'absolute',
    top: 8, // match dialContainer padding
    left: 8,
  },
  tapZone: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapZoneSelected: {
    backgroundColor: 'rgba(0,172,193,0.15)',
    borderWidth: 2,
    borderColor: '#00ACC1',
  },
  tapZoneText: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  tapZoneTextSelected: {
    color: '#00838F',
    fontWeight: '700',
  },

  // ── Test Bottom Section ──
  testBottomSection: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  selectedInfo: {
    fontSize: 13,
    color: '#00838F',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  equalBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#80DEEA',
  },
  equalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00838F',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#00ACC1',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: '#9E9E9E',
  },

  // ── Test Instructions (per eye) ──
  instructionBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  coverEyeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverEyeEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  coverEyeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  coverEyeDesc: {
    fontSize: 15,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  miniDialContainer: {
    marginVertical: 16,
    transform: [{ scale: 0.65 }],
  },
  instructionHint: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // ── Confirm Screen ──
  confirmBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmDesc: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },

  // ── Switch Eye Screen ──
  switchBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  switchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  switchEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  switchTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  switchDesc: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  switchHint: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  miniResultCard: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  miniResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00838F',
    marginBottom: 4,
  },
  miniResultText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Results ──
  overallResultBox: {
    alignItems: 'center',
    marginBottom: 8,
  },
  overallIndicator: {
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  overallLabel: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  eyeResultBlock: {
    paddingVertical: 8,
  },
  eyeResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eyeResultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  eyeResultSeverity: {
    fontSize: 14,
    fontWeight: '600',
  },
  eyeResultDetail: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
    marginBottom: 4,
  },
  eyeResultConsistency: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  // ── Summary Rows ──
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#616161',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },

  // ── Limitations ──
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  limitText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
    lineHeight: 20,
  },

  // ── Diagnosis ──
  diagnosisCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00ACC1',
  },
  diagnosisText: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  recommendText: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },

  // ── Buttons ──
  bottomBtnContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#00ACC1',
    width: '80%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ghostBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontSize: 15,
    color: '#00838F',
    fontWeight: '600',
  },

  // ── Disclaimer ──
  disclaimer: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 19,
    textAlign: 'center',
  },
});
