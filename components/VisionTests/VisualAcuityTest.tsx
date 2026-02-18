import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { restoreBrightness } from '../../lib/brightnessService';
import DistanceCalibration from './DistanceCalibration';

// ─── TYPES ───────────────────────────────────────────────────────────
type Eye = 'right' | 'left';
type TestPhase =
  | 'welcome'
  | 'distance-setup'
  | 'distance-calibrating'
  | 'distance-calibration'
  | 'distance-test'
  | 'distance-switch-eye'
  | 'distance-results'
  | 'near-setup'
  | 'near-calibrating'
  | 'near-test'
  | 'near-switch-eye'
  | 'near-results'
  | 'combined-results';

interface EyeResult {
  acuity: string;
  linesRead: number;
  decimal: number;
}

interface NearEyeResult {
  level: string;
  equivalent: string;
  linesRead: number;
}

interface DistanceResults {
  rightEye: EyeResult | null;
  leftEye: EyeResult | null;
}

interface NearResults {
  rightEye: NearEyeResult | null;
  leftEye: NearEyeResult | null;
}

interface Props {
  onComplete?: (results: any) => void;
  onExit?: () => void;
}

// ─── SCREEN CALIBRATION ──────────────────────────────────────────────
//
// React Native fontSize is in density-independent pixels (dp).
// 1 dp = 1/160 inch on Android (mdpi baseline) or 1/163 inch on iOS.
//
// To render a letter at a specific PHYSICAL height (in mm) on screen,
// we convert:  mm → inches → dp
//
//   dp = mm × (BASE_DPI / 25.4)
//
// PixelRatio is NOT used here because fontSize already works in dp.
// The OS handles dp → physical pixels internally.
//
// This gives us the correct physical size on every device, which is
// essential because the Snellen test depends on angular subtense.
//
// ─── ANGULAR SIZE FORMULA ────────────────────────────────────────────
//
// letterHeight = 2 × tan(θ/2) × distance
//
// For the 6/6 line:  θ = 5 arcminutes = 5/60 degrees = 0.001454 rad
//   at 6 m → height = 2 × tan(0.000727) × 6000 mm = 8.73 mm
//   at 3 m → height = 2 × tan(0.000727) × 3000 mm = 4.36 mm
//
// General at 3 m:  height_mm = (denominator / 6) × 4.365
//                            = denominator × 0.7275

const BASE_DPI = Platform.OS === 'ios' ? 163 : 160;
const MM_TO_DP = BASE_DPI / 25.4;  // dp per mm (~6.3 dp/mm)

/** Convert a physical measurement in millimetres to dp (fontSize units). */
const mmToDp = (mm: number): number => mm * MM_TO_DP;

// For the credit-card calibration overlay we also need this:
const SCREEN_DPI_PHYSICAL = PixelRatio.get() * BASE_DPI;
const mmToLayoutPixels = (mm: number): number => (mm / 25.4) * BASE_DPI;
// Layout uses dp too, so same conversion as mmToDp

// Maximum fontSize that fits inside the letter container
// (screen width minus horizontal margins and padding)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_LETTER_FONT = SCREEN_WIDTH - 80; // 20px margin each side + 20px padding each side

// ─── SNELLEN STANDARD — 3-METER TEST DISTANCE ───────────────────────
//
// The Snellen chart specifies letter heights by the visual angle they
// subtend.  A "6/6" letter subtends 5 arc-minutes at 6 m, giving a
// physical height of 8.73 mm.
//
// At 3 m (half the reference distance) the SAME angular subtense is
// produced by a letter HALF as tall.  So every letterHeight_mm below
// is exactly half the 6-metre chart value.
//
//   letterHeight_mm = (denominator / 6) × 8.73 / 2
//                   = denominator × 0.7275
//
// Sloan letters (C D E F H K N O P R S V Z) are the optometric
// standard — equal legibility, sans-serif, 5 × 5 grid.
// We restrict choices to this set to avoid bias.

const SLOAN_LETTERS = ['C', 'D', 'E', 'F', 'H', 'K', 'N', 'O', 'P', 'R', 'S', 'V', 'Z'];

const generateSloanChoices = (correct: string): string[] => {
  const pool = SLOAN_LETTERS.filter(l => l !== correct);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [correct, ...shuffled.slice(0, 3)].sort(() => Math.random() - 0.5);
};

// ─── TEST DATA ───────────────────────────────────────────────────────
// Each line's letterHeight_mm is derived from:
//
//   height = 2 × tan(5 arcmin / 2) × distance_mm
//
// For 3-metre test distance and each acuity denominator:
//   height_mm = 2 × tan(0.000727 rad) × 3000 × (denominator / 6)
//
//   6/60:  43.65 mm  |  6/36: 26.19 mm  |  6/24: 17.46 mm
//   6/18:  13.10 mm  |  6/12:  8.73 mm  |  6/9:   6.55 mm
//   6/7.5:  5.46 mm  |  6/6:   4.37 mm
//
// fontSize is clamped to MAX_LETTER_FONT so it never overflows.
const DISTANCE_TEST_LINES = [
  { line: 1, acuity: '6/60', decimal: 0.1,  letters: ['E'],                          letterHeight_mm: 43.65 },
  { line: 2, acuity: '6/36', decimal: 0.17, letters: ['F', 'P'],                     letterHeight_mm: 26.19 },
  { line: 3, acuity: '6/24', decimal: 0.25, letters: ['D', 'O', 'Z'],                letterHeight_mm: 17.46 },
  { line: 4, acuity: '6/18', decimal: 0.33, letters: ['N', 'P', 'E', 'H'],           letterHeight_mm: 13.10 },
  { line: 5, acuity: '6/12', decimal: 0.5,  letters: ['P', 'E', 'C', 'F', 'D'],      letterHeight_mm: 8.73  },
  { line: 6, acuity: '6/9',  decimal: 0.67, letters: ['E', 'D', 'F', 'C', 'Z', 'P'], letterHeight_mm: 6.55  },
  { line: 7, acuity: '6/7.5',decimal: 0.8,  letters: ['F', 'E', 'K', 'O', 'P', 'Z', 'D'], letterHeight_mm: 5.46 },
  { line: 8, acuity: '6/6',  decimal: 1.0,  letters: ['D', 'E', 'F', 'P', 'O', 'N', 'E', 'C'], letterHeight_mm: 4.37 },
].map(row => ({
  ...row,
  fontSize: Math.round(Math.min(mmToDp(row.letterHeight_mm), MAX_LETTER_FONT)),
}));

// ─── NEAR VISION — JAEGER / N-POINT STANDARD at 40 cm ───────────────
// N-point: 1 N-point ≈ 0.375 mm cap-height.
// Jaeger levels map to N-point sizes used worldwide.
const NEAR_VISION_LINES = [
  { level: 'J10', equivalent: 'N36', pointSize_mm: 13.50, text: 'THE QUICK BROWN FOX',                                       description: 'Very large print' },
  { level: 'J8',  equivalent: 'N24', pointSize_mm: 9.00,  text: 'THE QUICK BROWN FOX JUMPS',                                  description: 'Large print' },
  { level: 'J6',  equivalent: 'N18', pointSize_mm: 6.75,  text: 'THE QUICK BROWN FOX JUMPS OVER',                             description: 'Moderately large' },
  { level: 'J5',  equivalent: 'N12', pointSize_mm: 4.50,  text: 'The quick brown fox jumps over the lazy',                     description: 'Book print size' },
  { level: 'J3',  equivalent: 'N8',  pointSize_mm: 3.00,  text: 'The quick brown fox jumps over the lazy dog',                 description: 'Standard newsprint' },
  { level: 'J2',  equivalent: 'N6',  pointSize_mm: 2.25,  text: 'The quick brown fox jumps over the lazy dog nearby',          description: 'Small newsprint' },
  { level: 'J1',  equivalent: 'N5',  pointSize_mm: 1.875, text: 'The quick brown fox jumps over the lazy dog in the field',    description: 'Fine print (excellent)' },
].map(row => ({
  ...row,
  fontSize: Math.round(mmToDp(row.pointSize_mm)),
}));

// Credit-card calibration reference (ISO/IEC 7810 ID-1)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;

// ─── HELPERS ─────────────────────────────────────────────────────────
const getAcuityRating = (acuity: string): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    '6/6':   { label: 'Excellent',  color: '#2E7D32' },
    '6/7.5': { label: 'Very Good',  color: '#558B2F' },
    '6/9':   { label: 'Good',       color: '#689F38' },
    '6/12':  { label: 'Fair',       color: '#F9A825' },
    '6/18':  { label: 'Poor',       color: '#EF6C00' },
    '6/24':  { label: 'Poor',       color: '#E65100' },
    '6/36':  { label: 'Very Poor',  color: '#BF360C' },
    '6/60':  { label: 'Very Poor',  color: '#B71C1C' },
  };
  return map[acuity] || { label: 'Not tested', color: '#757575' };
};

const getNearRating = (level: string): { label: string; color: string } => {
  const map: Record<string, { label: string; color: string }> = {
    'J1':  { label: 'Excellent',  color: '#2E7D32' },
    'J2':  { label: 'Very Good',  color: '#558B2F' },
    'J3':  { label: 'Good',       color: '#689F38' },
    'J5':  { label: 'Fair',       color: '#F9A825' },
    'J6':  { label: 'Fair',       color: '#EF6C00' },
    'J8':  { label: 'Poor',       color: '#E65100' },
    'J10': { label: 'Very Poor',  color: '#BF360C' },
  };
  return map[level] || { label: 'Not tested', color: '#757575' };
};

const interpretResults = (
  distance: DistanceResults,
  near: NearResults
): { condition: string; severity: string; description: string; recommendation: string; urgency: string; color: string } => {
  const dR = distance.rightEye?.decimal ?? 1;
  const dL = distance.leftEye?.decimal ?? 1;
  const bestDist = Math.max(dR, dL);

  const nearLevels: Record<string, number> = { J1: 1, J2: 2, J3: 3, J5: 5, J6: 6, J8: 8, J10: 10 };
  const nR = nearLevels[near.rightEye?.level ?? 'J1'] ?? 1;
  const nL = nearLevels[near.leftEye?.level ?? 'J1'] ?? 1;
  const bestNear = Math.min(nR, nL);

  // MYOPIA: Poor distance + Good near
  if (bestDist < 0.5 && bestNear <= 4) {
    return {
      condition: 'Likely Myopia (Nearsightedness)',
      severity: bestDist < 0.33 ? 'Moderate to Severe' : 'Mild to Moderate',
      description: 'You can see nearby objects clearly but struggle with distant objects. This is consistent with myopia.',
      recommendation: 'Visit an optometrist for a comprehensive refraction test. You will likely benefit from distance glasses or contact lenses.',
      urgency: bestDist < 0.2 ? 'urgent' : 'within_1_month',
      color: bestDist < 0.2 ? '#C62828' : '#EF6C00',
    };
  }

  // HYPERMETROPIA: Good distance + Poor near
  if (bestDist >= 0.5 && bestNear >= 6) {
    return {
      condition: 'Likely Hypermetropia (Farsightedness)',
      severity: bestNear >= 8 ? 'Moderate to Severe' : 'Mild to Moderate',
      description: 'You can see distant objects well but struggle with reading and close-up tasks. This is consistent with hypermetropia.',
      recommendation: 'Visit an optometrist for near vision correction. Reading glasses or bifocals may help.',
      urgency: bestNear >= 10 ? 'urgent' : 'within_1_month',
      color: bestNear >= 10 ? '#C62828' : '#EF6C00',
    };
  }

  // BOTH POOR
  if (bestDist < 0.5 && bestNear >= 6) {
    return {
      condition: 'Significant Vision Impairment',
      severity: 'Requires Professional Assessment',
      description: 'Both distance and near vision show significant limitations. This could indicate a complex refractive error, presbyopia combined with myopia, or other eye conditions.',
      recommendation: 'Please visit an eye care professional as soon as possible for a comprehensive examination.',
      urgency: 'urgent',
      color: '#C62828',
    };
  }

  // NORMAL
  if (bestDist >= 0.67 && bestNear <= 4) {
    return {
      condition: 'Normal Vision',
      severity: 'No Significant Issues',
      description: 'Your distance and near vision are both within the normal range. No immediate concerns detected.',
      recommendation: 'Continue routine eye checkups every 1-2 years. Maintain good eye health habits.',
      urgency: 'low',
      color: '#2E7D32',
    };
  }

  // BORDERLINE
  return {
    condition: 'Borderline Vision',
    severity: 'Minor Concerns',
    description: 'Your vision shows some minor limitations that could be early-stage refractive error or temporary factors like eye fatigue.',
    recommendation: 'Monitor your vision and retest in 3-6 months. Consider a professional checkup if symptoms persist.',
    urgency: 'low',
    color: '#F9A825',
  };
};

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function VisualAcuityTest({ onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<TestPhase>('welcome');
  const [currentEye, setCurrentEye] = useState<Eye>('right');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Distance results
  const [distanceResults, setDistanceResults] = useState<DistanceResults>({
    rightEye: null,
    leftEye: null,
  });

  // Near vision state
  const [nearLineIndex, setNearLineIndex] = useState(0);
  const [nearResults, setNearResults] = useState<NearResults>({
    rightEye: null,
    leftEye: null,
  });

  // ─── Animations ─────────────────────────────
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
    'distance-setup': 'welcome',
    'distance-calibrating': 'distance-setup',
    'distance-calibration': 'distance-calibrating',
    'distance-test': 'distance-calibration',
    'distance-switch-eye': 'distance-test',
    'distance-results': 'distance-test',
    'near-setup': 'distance-results',
    'near-calibrating': 'near-setup',
    'near-test': 'near-calibrating',
    'near-switch-eye': 'near-test',
    'near-results': 'near-test',
    'combined-results': 'near-results',
  };

  useEffect(() => {
    const handler = () => {
      const prev = previousPhaseMap[phase];
      if (prev === 'exit') {
        restoreBrightness();
        onExit?.();
      } else {
        setPhase(prev);
      }
      return true; // prevent default back behaviour
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription.remove();
  }, [phase, onExit]);

  // ─── DISTANCE TEST LOGIC ─────────────────────
  const currentDistanceLine = DISTANCE_TEST_LINES[currentLineIndex];
  const currentLetter = currentDistanceLine?.letters[currentLetterIndex];

  const generateDistanceChoices = (): string[] => {
    if (!currentDistanceLine || !currentLetter) return [];
    return generateSloanChoices(currentLetter);
  };

  const handleDistanceAnswer = (answer: string) => {
    const isCorrect = answer === currentLetter;

    if (!isCorrect) {
      const newErrors = consecutiveErrors + 1;
      setConsecutiveErrors(newErrors);

      // 2 consecutive errors on the same line → stop
      if (newErrors >= 2) {
        const bestLine = currentLineIndex > 0 ? DISTANCE_TEST_LINES[currentLineIndex - 1] : DISTANCE_TEST_LINES[0];
        finishDistanceEye(bestLine);
        return;
      }
    } else {
      setConsecutiveErrors(0);
    }

    // Move to next letter in this line
    if (currentLetterIndex < currentDistanceLine.letters.length - 1) {
      animateTransition(() => setCurrentLetterIndex(prev => prev + 1));
      return;
    }

    // If incorrect on last letter, record previous line
    if (!isCorrect) {
      const bestLine = currentLineIndex > 0 ? DISTANCE_TEST_LINES[currentLineIndex - 1] : DISTANCE_TEST_LINES[0];
      finishDistanceEye(bestLine);
      return;
    }

    // Move to next line
    if (currentLineIndex < DISTANCE_TEST_LINES.length - 1) {
      animateTransition(() => {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentLetterIndex(0);
        setConsecutiveErrors(0);
      });
    } else {
      // Completed all lines!
      finishDistanceEye(DISTANCE_TEST_LINES[DISTANCE_TEST_LINES.length - 1]);
    }
  };

  const handleCantSee = () => {
    const bestLine = currentLineIndex > 0 ? DISTANCE_TEST_LINES[currentLineIndex - 1] : null;
    if (bestLine) {
      finishDistanceEye(bestLine);
    } else {
      // Can't even see the largest letter
      finishDistanceEye({ ...DISTANCE_TEST_LINES[0], acuity: 'Worse than 6/60', decimal: 0.05, line: 0 });
    }
  };

  const finishDistanceEye = (bestLine: typeof DISTANCE_TEST_LINES[0] & { acuity: string; decimal: number }) => {
    const result: EyeResult = {
      acuity: bestLine.acuity,
      linesRead: bestLine.line,
      decimal: bestLine.decimal,
    };

    if (currentEye === 'right') {
      setDistanceResults(prev => ({ ...prev, rightEye: result }));
      // Show switch-eye interstitial before testing left eye
      setPhase('distance-switch-eye');
    } else {
      setDistanceResults(prev => ({ ...prev, leftEye: result }));
      setPhase('distance-results');
    }
  };

  // ─── NEAR VISION TEST LOGIC ────────────────────
  const currentNearLine = NEAR_VISION_LINES[nearLineIndex];

  const handleNearAnswer = (canRead: boolean) => {
    if (canRead) {
      // Move to next (smaller) line
      if (nearLineIndex < NEAR_VISION_LINES.length - 1) {
        animateTransition(() => setNearLineIndex(prev => prev + 1));
      } else {
        // Read all lines perfectly
        finishNearEye(NEAR_VISION_LINES[NEAR_VISION_LINES.length - 1]);
      }
    } else {
      // Can't read this line — record previous as best
      const bestLine = nearLineIndex > 0 ? NEAR_VISION_LINES[nearLineIndex - 1] : null;
      if (bestLine) {
        finishNearEye(bestLine);
      } else {
        finishNearEye({ ...NEAR_VISION_LINES[0], level: 'Worse than J10' });
      }
    }
  };

  const finishNearEye = (bestLine: typeof NEAR_VISION_LINES[0]) => {
    const result: NearEyeResult = {
      level: bestLine.level,
      equivalent: bestLine.equivalent,
      linesRead: NEAR_VISION_LINES.indexOf(bestLine) + 1,
    };

    if (currentEye === 'right') {
      setNearResults(prev => ({ ...prev, rightEye: result }));
      // Show switch-eye interstitial before testing left eye
      setPhase('near-switch-eye');
    } else {
      setNearResults(prev => ({ ...prev, leftEye: result }));
      setPhase('near-results');
    }
  };

  // ─── RENDER ────────────────────────────────────

  // ===== WELCOME SCREEN =====
  if (phase === 'welcome') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            {onExit && (
              <TouchableOpacity style={styles.backArrow} onPress={() => { restoreBrightness(); onExit(); }}>
                <Text style={styles.backArrowText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerEmoji}>👁️</Text>
            <Text style={styles.headerTitle}>Visual Acuity Test</Text>
            <Text style={styles.headerSubtitle}>Distance & Near Vision Screening</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What We'll Test</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📏</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Distance Vision</Text>
                <Text style={styles.infoDesc}>Detects myopia (nearsightedness) — difficulty seeing far objects like blackboards or road signs.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📖</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Near Vision</Text>
                <Text style={styles.infoDesc}>Detects hypermetropia (farsightedness) — difficulty reading books or phone screens.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>8–12 Minutes</Text>
                <Text style={styles.infoDesc}>Each eye is tested separately for both distance and near vision.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('distance-setup')}>
            <Text style={styles.primaryBtnText}>Start Screening</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== DISTANCE SETUP =====
  if (phase === 'distance-setup') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <TouchableOpacity style={styles.backArrow} onPress={() => setPhase('welcome')}>
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>📏</Text>
            <Text style={styles.headerTitle}>Distance Vision Test</Text>
            <Text style={styles.headerSubtitle}>Part 1 of 2</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Setup Instructions</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
              <Text style={styles.stepText}>Stand still and hold the phone facing you</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
              <Text style={styles.stepText}>The app will guide you with voice to the correct 3-metre distance</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
              <Text style={styles.stepText}>Screen brightness will be set to maximum automatically</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>4</Text></View>
              <Text style={styles.stepText}>Have someone help tap answers, or use voice</Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 The app uses motion sensors to measure distance — a helper walks the phone to the correct position</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('distance-calibrating')}>
            <Text style={styles.primaryBtnText}>I've Positioned My Phone</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== DISTANCE CALIBRATING (camera + face-distance + voice) =====
  if (phase === 'distance-calibrating') {
    return (
      <DistanceCalibration
        mode="distance"
        onCalibrated={() => setPhase('distance-calibration')}
        onSkip={() => setPhase('distance-calibration')}
      />
    );
  }

  // ===== DISTANCE CALIBRATION =====
  if (phase === 'distance-calibration') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <TouchableOpacity style={styles.backArrow} onPress={() => setPhase('distance-setup')}>
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>📐</Text>
            <Text style={styles.headerTitle}>Distance Check</Text>
            <Text style={styles.headerSubtitle}>Are you 3 meters away?</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Check</Text>
            <Text style={styles.bodyText}>You should be about 3 meters from the screen. Use these guides:</Text>

            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>🦶</Text>
              <Text style={styles.checkText}>Walk 3-4 large steps back from the phone</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>🛋️</Text>
              <Text style={styles.checkText}>About the length of a standard sofa</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>📏</Text>
              <Text style={styles.checkText}>Use a measuring tape if available</Text>
            </View>

            <View style={styles.calibrationBox}>
              <Text style={styles.calibrationLetter}>E</Text>
              <Text style={styles.calibrationHint}>Can you see this letter clearly from where you stand?</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>� Screen Calibration Check</Text>
            <Text style={styles.bodyText}>
              Place a standard credit/debit card on the rectangle below. If it matches, your screen is properly calibrated for accurate results.
            </Text>
            <View style={{
              width: mmToLayoutPixels(CARD_WIDTH_MM),
              height: mmToLayoutPixels(CARD_HEIGHT_MM),
              borderWidth: 2,
              borderColor: '#00ACC1',
              borderStyle: 'dashed',
              borderRadius: 8,
              alignSelf: 'center',
              marginVertical: 16,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#00ACC1', fontSize: 12, textAlign: 'center' }}>
                📇 Place card here
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9E9E9E', textAlign: 'center', lineHeight: 18 }}>
              If the card doesn't match exactly, results may be slightly less precise. Most modern phones are well-calibrated.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>�👁️ Starting with Right Eye</Text>
            <Text style={styles.bodyText}>
              Before we begin, cover your LEFT eye with your hand. Keep your RIGHT eye open.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setCurrentEye('right');
              setCurrentLineIndex(0);
              setCurrentLetterIndex(0);
              setConsecutiveErrors(0);
              setPhase('distance-test');
            }}
          >
            <Text style={styles.primaryBtnText}>Yes, I'm Ready</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== DISTANCE TEST =====
  if (phase === 'distance-test') {
    const eyeLabel = currentEye === 'right' ? 'RIGHT' : 'LEFT';
    const coverLabel = currentEye === 'right' ? 'LEFT' : 'RIGHT';
    const choices = generateDistanceChoices();
    const progress = (currentLineIndex / DISTANCE_TEST_LINES.length) * 100;

    return (
      <View style={[styles.screen, styles.testScreen]}>
        {/* Eye indicator */}
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>Testing: {eyeLabel} EYE</Text>
          <Text style={styles.eyeBannerSub}>Cover your {coverLabel} eye with your hand</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>Line {currentLineIndex + 1} of {DISTANCE_TEST_LINES.length}</Text>
        </View>

        {/* Letter display — fills remaining space above the fixed bottom */}
        <View style={styles.letterArea}>
          <View style={styles.letterContainer}>
            <Animated.Text
              style={[styles.testLetter, {
                fontSize: currentDistanceLine.fontSize,
                fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
                opacity: fadeAnim,
              }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {currentLetter}
            </Animated.Text>
          </View>
        </View>

        {/* Fixed bottom: question, choices, can't-see */}
        <View style={styles.testBottomSection}>
          <Text style={styles.questionText}>What letter do you see?</Text>

          <View style={styles.choicesGrid}>
            {choices.map((choice, idx) => (
              <TouchableOpacity
                key={`${choice}-${idx}`}
                style={styles.choiceBtn}
                onPress={() => handleDistanceAnswer(choice)}
              >
                <Text style={styles.choiceBtnText}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cantSeeBtn} onPress={handleCantSee}>
            <Text style={styles.cantSeeBtnText}>Can't See Clearly</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== DISTANCE SWITCH EYE =====
  if (phase === 'distance-switch-eye') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerEmoji}>🔄</Text>
            <Text style={styles.headerTitle}>Switch to Left Eye</Text>
            <Text style={styles.headerSubtitle}>Distance Vision — Part 1 of 2</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Great job on the right eye!</Text>
            <Text style={styles.bodyText}>
              Now we need to test your left eye. Please:
            </Text>

            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>🤚</Text>
              <Text style={styles.checkText}>Cover your RIGHT eye with your hand</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>👁️</Text>
              <Text style={styles.checkText}>Keep your LEFT eye open</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>📏</Text>
              <Text style={styles.checkText}>Stay 3 meters from the screen</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Tap "I'm Ready" once your right eye is covered and you can only see the screen with your left eye.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setCurrentEye('left');
              setCurrentLineIndex(0);
              setCurrentLetterIndex(0);
              setConsecutiveErrors(0);
              setPhase('distance-test');
            }}
          >
            <Text style={styles.primaryBtnText}>I'm Ready</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== DISTANCE RESULTS =====
  if (phase === 'distance-results') {
    const rRating = distanceResults.rightEye ? getAcuityRating(distanceResults.rightEye.acuity) : null;
    const lRating = distanceResults.leftEye ? getAcuityRating(distanceResults.leftEye.acuity) : null;

    return (
      <View style={styles.screenFlex}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.headerBanner}>
          <Text style={styles.headerEmoji}>📏</Text>
          <Text style={styles.headerTitle}>Distance Vision Results</Text>
          <Text style={styles.headerSubtitle}>Part 1 Complete</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.resultRow}>
            <Text style={styles.resultEyeLabel}>Right Eye</Text>
            <View style={styles.resultValueBlock}>
              <Text style={styles.resultAcuity}>{distanceResults.rightEye?.acuity ?? '—'}</Text>
              {rRating && <Text style={[styles.resultRating, { color: rRating.color }]}>{rRating.label}</Text>}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.resultRow}>
            <Text style={styles.resultEyeLabel}>Left Eye</Text>
            <View style={styles.resultValueBlock}>
              <Text style={styles.resultAcuity}>{distanceResults.leftEye?.acuity ?? '—'}</Text>
              {lRating && <Text style={[styles.resultRating, { color: lRating.color }]}>{lRating.label}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.bodyText}>
            {(distanceResults.rightEye?.decimal ?? 1) < 0.5 || (distanceResults.leftEye?.decimal ?? 1) < 0.5
              ? '⚠️ Your distance vision may indicate myopia (nearsightedness). Continue to the near vision test for a complete assessment.'
              : '✅ Your distance vision appears to be in a healthy range. Continue to the near vision test to complete the screening.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBtnContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
          setCurrentEye('right');
          setNearLineIndex(0);
          setPhase('near-setup');
        }}>
          <Text style={styles.primaryBtnText}>Continue to Near Vision Test</Text>
        </TouchableOpacity>
      </View>
      </View>
    );
  }

  // ===== NEAR VISION SETUP =====
  if (phase === 'near-setup') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <TouchableOpacity style={styles.backArrow} onPress={() => setPhase('distance-results')}>
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>📖</Text>
            <Text style={styles.headerTitle}>Near Vision Test</Text>
            <Text style={styles.headerSubtitle}>Part 2 of 2</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Setup Instructions</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
              <Text style={styles.stepText}>Hold the phone facing you — the app will guide you to 40 cm</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
              <Text style={styles.stepText}>Brightness will stay at maximum for best contrast</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
              <Text style={styles.stepText}>We'll show text in decreasing sizes — read each aloud</Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 40 cm is roughly the length from your elbow to your fingertips</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>👁️ Starting with Right Eye</Text>
            <Text style={styles.bodyText}>
              Before we begin, cover your LEFT eye with your hand. Keep your RIGHT eye open.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setCurrentEye('right');
              setNearLineIndex(0);
              setPhase('near-calibrating');
            }}
          >
            <Text style={styles.primaryBtnText}>I'm Ready</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== NEAR CALIBRATING (camera + face-distance + voice) =====
  if (phase === 'near-calibrating') {
    return (
      <DistanceCalibration
        mode="near"
        onCalibrated={() => setPhase('near-test')}
        onSkip={() => setPhase('near-test')}
      />
    );
  }

  // ===== NEAR VISION TEST =====
  if (phase === 'near-test') {
    const eyeLabel = currentEye === 'right' ? 'RIGHT' : 'LEFT';
    const coverLabel = currentEye === 'right' ? 'LEFT' : 'RIGHT';
    const progress = (nearLineIndex / NEAR_VISION_LINES.length) * 100;

    return (
      <View style={[styles.screen, styles.testScreen]}>
        {/* Eye indicator */}
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>Testing: {eyeLabel} EYE (Near)</Text>
          <Text style={styles.eyeBannerSub}>Cover your {coverLabel} eye with your hand</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>Level {nearLineIndex + 1} of {NEAR_VISION_LINES.length}</Text>
        </View>

        {/* Text display — fades between levels */}
        <View style={styles.nearTextContainer}>
          <Animated.Text style={[styles.nearTestText, {
            fontSize: currentNearLine.fontSize,
            lineHeight: Math.round(currentNearLine.fontSize * 1.4),
            opacity: fadeAnim,
          }]}>
            {currentNearLine.text}
          </Animated.Text>
          <Animated.Text style={[styles.nearLevelLabel, { opacity: fadeAnim }]}>
            {currentNearLine.level} — {currentNearLine.description}
          </Animated.Text>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>Can you read this text clearly?</Text>

        {/* Answers */}
        <View style={styles.nearChoicesRow}>
          <TouchableOpacity
            style={[styles.nearChoiceBtn, styles.nearYesBtn]}
            onPress={() => handleNearAnswer(true)}
          >
            <Text style={styles.nearChoiceBtnText}>✅ Yes, clearly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nearChoiceBtn, styles.nearNoBtn]}
            onPress={() => handleNearAnswer(false)}
          >
            <Text style={styles.nearChoiceBtnText}>❌ No, it's blurry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== NEAR SWITCH EYE =====
  if (phase === 'near-switch-eye') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <Text style={styles.headerEmoji}>🔄</Text>
            <Text style={styles.headerTitle}>Switch to Left Eye</Text>
            <Text style={styles.headerSubtitle}>Near Vision — Part 2 of 2</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Right eye complete!</Text>
            <Text style={styles.bodyText}>
              Now we'll test your left eye's near vision. Please:
            </Text>

            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>🤚</Text>
              <Text style={styles.checkText}>Cover your RIGHT eye with your hand</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>👁️</Text>
              <Text style={styles.checkText}>Keep your LEFT eye open</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>📖</Text>
              <Text style={styles.checkText}>Hold the phone at 40 cm (arm's length)</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Tap "I'm Ready" once your right eye is covered and you can only see the screen with your left eye.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setCurrentEye('left');
              setNearLineIndex(0);
              setPhase('near-test');
            }}
          >
            <Text style={styles.primaryBtnText}>I'm Ready</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== NEAR RESULTS =====
  if (phase === 'near-results') {
    const rRating = nearResults.rightEye ? getNearRating(nearResults.rightEye.level) : null;
    const lRating = nearResults.leftEye ? getNearRating(nearResults.leftEye.level) : null;

    return (
      <View style={styles.screenFlex}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.headerBanner}>
          <Text style={styles.headerEmoji}>📖</Text>
          <Text style={styles.headerTitle}>Near Vision Results</Text>
          <Text style={styles.headerSubtitle}>Part 2 Complete</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.resultRow}>
            <Text style={styles.resultEyeLabel}>Right Eye</Text>
            <View style={styles.resultValueBlock}>
              <Text style={styles.resultAcuity}>{nearResults.rightEye?.level ?? '—'}</Text>
              {rRating && <Text style={[styles.resultRating, { color: rRating.color }]}>{rRating.label}</Text>}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.resultRow}>
            <Text style={styles.resultEyeLabel}>Left Eye</Text>
            <View style={styles.resultValueBlock}>
              <Text style={styles.resultAcuity}>{nearResults.leftEye?.level ?? '—'}</Text>
              {lRating && <Text style={[styles.resultRating, { color: lRating.color }]}>{lRating.label}</Text>}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBtnContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('combined-results')}>
          <Text style={styles.primaryBtnText}>View Complete Assessment</Text>
        </TouchableOpacity>
      </View>
      </View>
    );
  }

  // ===== COMBINED RESULTS =====
  if (phase === 'combined-results') {
    const diagnosis = interpretResults(distanceResults, nearResults);

    const allResults = {
      distanceVision: distanceResults,
      nearVision: nearResults,
      diagnosis,
      testDate: new Date().toISOString(),
      methodology: {
        distanceTest: '3-metre Snellen chart (DPI-calibrated, face-distance verified)',
        nearTest: '40 cm Jaeger scale (DPI-calibrated, face-distance verified)',
        brightnessControl: 'Auto-maxed to 100% during test',
        letterSet: 'Sloan optotype letters',
        screenDPI: Math.round(SCREEN_DPI_PHYSICAL),
        pixelRatio: PixelRatio.get(),
      },
    };

    return (
      <View style={styles.screenFlex}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={[styles.headerBanner, { backgroundColor: diagnosis.color }]}>
          <Text style={styles.headerEmoji}>🩺</Text>
          <Text style={styles.headerTitle}>{diagnosis.condition}</Text>
          <Text style={styles.headerSubtitle}>{diagnosis.severity}</Text>
        </View>

        {/* Test Methodology */}
        <View style={[styles.card, { backgroundColor: '#E0F7FA' }]}>
          <Text style={{ fontSize: 13, color: '#00695C', lineHeight: 19, textAlign: 'center' }}>
            📐 Tested at verified distances (camera-calibrated) with auto-max brightness • Snellen 3 m + Jaeger 40 cm
          </Text>
        </View>

        {/* Distance Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📏 Distance Vision (3 m Snellen)</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Right Eye:</Text>
            <Text style={styles.summaryValue}>
              {distanceResults.rightEye?.acuity ?? '—'}
              {distanceResults.rightEye ? ` (${getAcuityRating(distanceResults.rightEye.acuity).label})` : ''}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Left Eye:</Text>
            <Text style={styles.summaryValue}>
              {distanceResults.leftEye?.acuity ?? '—'}
              {distanceResults.leftEye ? ` (${getAcuityRating(distanceResults.leftEye.acuity).label})` : ''}
            </Text>
          </View>
        </View>

        {/* Near Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 Near Vision (40 cm Jaeger)</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Right Eye:</Text>
            <Text style={styles.summaryValue}>
              {nearResults.rightEye?.level ?? '—'} ({nearResults.rightEye?.equivalent ?? '—'})
              {nearResults.rightEye ? ` — ${getNearRating(nearResults.rightEye.level).label}` : ''}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Left Eye:</Text>
            <Text style={styles.summaryValue}>
              {nearResults.leftEye?.level ?? '—'} ({nearResults.leftEye?.equivalent ?? '—'})
              {nearResults.leftEye ? ` — ${getNearRating(nearResults.leftEye.level).label}` : ''}
            </Text>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={[styles.card, styles.diagnosisCard]}>
          <Text style={styles.cardTitle}>Assessment</Text>
          <Text style={styles.diagnosisText}>{diagnosis.description}</Text>
          <View style={styles.divider} />
          <Text style={styles.recommendTitle}>📋 Recommendation</Text>
          <Text style={styles.recommendText}>{diagnosis.recommendation}</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This screening is not a substitute for a professional eye examination. 
            Please visit a qualified optometrist for a comprehensive assessment.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBtnContainer}>
        {onComplete && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {
            restoreBrightness();
            onComplete(allResults);
          }}>
            <Text style={styles.primaryBtnText}>Done — Save Results</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
    );
  }

  return null;
}

// ─── STYLES ──────────────────────────────────────────────────────────
const width = SCREEN_WIDTH;

const styles = StyleSheet.create({
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
    fontSize: 28,
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

  // ── Calibration ──
  calibrationBox: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calibrationLetter: {
    fontSize: 100,
    fontWeight: 'bold',
    color: '#212121',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  calibrationHint: {
    fontSize: 13,
    color: '#757575',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // ── Check items ──
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    color: '#424242',
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

  // ── Distance Test Letter ──
  letterArea: {
    flex: 1,
    justifyContent: 'center',
  },
  letterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  testLetter: {
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0,
  },

  // ── Question ──
  testBottomSection: {
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10,
  },

  // ── Choices ──
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  choiceBtn: {
    width: (width - 64) / 2,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#80DEEA',
  },
  choiceBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#00838F',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  cantSeeBtn: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    marginBottom: 16,
  },
  cantSeeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C62828',
  },

  // ── Near Vision Test ──
  nearTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  nearTestText: {
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  nearLevelLabel: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 12,
  },
  nearChoicesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  nearChoiceBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nearYesBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  nearNoBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#C62828',
  },
  nearChoiceBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  // ── Results ──
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultEyeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  resultValueBlock: {
    alignItems: 'flex-end',
  },
  resultAcuity: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  resultRating: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
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
    marginHorizontal: 16,
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
