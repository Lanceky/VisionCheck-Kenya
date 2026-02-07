import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AstigmatismTest from '../components/VisionTests/AstigmatismTest';
import ColorVisionTest from '../components/VisionTests/ColorVisionTest';
import VisualAcuityTest from '../components/VisionTests/VisualAcuityTest';

// ─── TYPES ───────────────────────────────────────────────────────────
type SuitePhase =
  | 'overview'
  | 'visual-acuity'
  | 'transition-color'
  | 'color-vision'
  | 'transition-astigmatism'
  | 'astigmatism'
  | 'summary';

interface TestStatus {
  completed: boolean;
  skipped: boolean;
  results: any;
}

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function TestSuiteScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<SuitePhase>('overview');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [visualAcuity, setVisualAcuity] = useState<TestStatus>({ completed: false, skipped: false, results: null });
  const [colorVision, setColorVision] = useState<TestStatus>({ completed: false, skipped: false, results: null });
  const [astigmatism, setAstigmatism] = useState<TestStatus>({ completed: false, skipped: false, results: null });

  // ─── Navigation helpers ──────────────────────
  const handleExit = () => {
    router.back();
  };

  // ─── Visual Acuity handlers ──────────────────
  const handleVAComplete = (results: any) => {
    setVisualAcuity({ completed: true, skipped: false, results });
  };

  const handleVAExit = () => {
    // When user exits VA test, move to transition screen
    if (!visualAcuity.completed) {
      setVisualAcuity(prev => ({ ...prev, completed: true }));
    }
    setPhase('transition-color');
  };

  const handleSkipVA = () => {
    setVisualAcuity({ completed: false, skipped: true, results: null });
    setPhase('transition-color');
  };

  // ─── Color Vision handlers ───────────────────
  const handleCVComplete = (results: any) => {
    setColorVision({ completed: true, skipped: false, results });
  };

  const handleCVExit = () => {
    if (!colorVision.completed) {
      setColorVision(prev => ({ ...prev, completed: true }));
    }
    setPhase('transition-astigmatism');
  };

  const handleSkipCV = () => {
    setColorVision({ completed: false, skipped: true, results: null });
    setPhase('transition-astigmatism');
  };

  // ─── Astigmatism handlers ────────────────────
  const handleAstigComplete = (results: any) => {
    setAstigmatism({ completed: true, skipped: false, results });
  };

  const handleAstigExit = () => {
    if (!astigmatism.completed) {
      setAstigmatism(prev => ({ ...prev, completed: true }));
    }
    setPhase('summary');
  };

  const handleSkipAstig = () => {
    setAstigmatism({ completed: false, skipped: true, results: null });
    setPhase('summary');
  };

  // ─── Count completed tests ───────────────────
  const completedCount = [visualAcuity, colorVision, astigmatism].filter(t => t.completed && !t.skipped).length;
  const skippedCount = [visualAcuity, colorVision, astigmatism].filter(t => t.skipped).length;
  const totalTests = 3;

  // ─── Get status badge ────────────────────────
  const getStatusBadge = (status: TestStatus) => {
    if (status.completed && !status.skipped) return { label: 'Completed', color: '#2E7D32', bg: '#E8F5E9' };
    if (status.skipped) return { label: 'Skipped', color: '#F57C00', bg: '#FFF3E0' };
    return { label: 'Pending', color: '#757575', bg: '#F5F5F5' };
  };

  // ===== OVERVIEW SCREEN =====
  if (phase === 'overview') {
    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={styles.headerBanner}>
            <TouchableOpacity style={styles.backArrow} onPress={handleExit}>
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>🏥</Text>
            <Text style={styles.headerTitle}>Complete Eye Screening</Text>
            <Text style={styles.headerSubtitle}>3 tests • ~10 minutes total</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Screening Plan</Text>
            <Text style={styles.bodyText}>
              We'll guide you through three clinically-standard tests in sequence. You can skip any test you'd like.
            </Text>
          </View>

          {/* Test 1 */}
          <View style={styles.testPlanCard}>
            <View style={styles.testPlanRow}>
              <View style={styles.testPlanNumber}>
                <Text style={styles.testPlanNumberText}>1</Text>
              </View>
              <View style={styles.testPlanInfo}>
                <Text style={styles.testPlanTitle}>👓 Visual Acuity</Text>
                <Text style={styles.testPlanDesc}>
                  Distance & near vision clarity • Snellen & Jaeger standard
                </Text>
                <Text style={styles.testPlanTime}>~5 min</Text>
              </View>
            </View>
          </View>

          {/* Test 2 */}
          <View style={styles.testPlanCard}>
            <View style={styles.testPlanRow}>
              <View style={styles.testPlanNumber}>
                <Text style={styles.testPlanNumberText}>2</Text>
              </View>
              <View style={styles.testPlanInfo}>
                <Text style={styles.testPlanTitle}>🎨 Color Vision</Text>
                <Text style={styles.testPlanDesc}>
                  Red-green & blue-yellow screening • Ishihara 14-plate
                </Text>
                <Text style={styles.testPlanTime}>~3 min</Text>
              </View>
            </View>
          </View>

          {/* Test 3 */}
          <View style={styles.testPlanCard}>
            <View style={styles.testPlanRow}>
              <View style={styles.testPlanNumber}>
                <Text style={styles.testPlanNumberText}>3</Text>
              </View>
              <View style={styles.testPlanInfo}>
                <Text style={styles.testPlanTitle}>◎ Astigmatism</Text>
                <Text style={styles.testPlanDesc}>
                  Directional focus balance • Astigmatic dial method
                </Text>
                <Text style={styles.testPlanTime}>~3 min</Text>
              </View>
            </View>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              💡 You can skip any test and return to it later from the home screen. Each test can also be run independently.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setPhase('visual-acuity')}
          >
            <Text style={styles.primaryBtnText}>Begin Screening</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== VISUAL ACUITY TEST =====
  if (phase === 'visual-acuity') {
    // If already completed (user pressed Done and came back), go to transition
    if (visualAcuity.completed) {
      setPhase('transition-color');
      return null;
    }

    return (
      <VisualAcuityTest
        onComplete={handleVAComplete}
        onExit={handleVAExit}
      />
    );
  }

  // ===== TRANSITION: VA → COLOR VISION =====
  if (phase === 'transition-color') {
    const vaBadge = getStatusBadge(visualAcuity);

    return (
      <View style={styles.screenFlex}>
        <View style={styles.transitionBanner}>
          <Text style={styles.transitionCheckmark}>✓</Text>
          <Text style={styles.transitionTitle}>
            {visualAcuity.skipped ? 'Visual Acuity Skipped' : 'Visual Acuity Complete'}
          </Text>
        </View>

        <View style={styles.transitionBody}>
          <View style={styles.transitionCard}>
            <Text style={styles.transitionNextLabel}>Up Next</Text>
            <Text style={styles.transitionNextEmoji}>🎨</Text>
            <Text style={styles.transitionNextTitle}>Color Vision Test</Text>
            <Text style={styles.transitionNextDesc}>
              Identify numbers hidden in colored dot patterns. Tests for red-green and blue-yellow color vision deficiencies.
            </Text>
            <Text style={styles.transitionNextTime}>~3 minutes</Text>
          </View>

          <View style={styles.progressDots}>
            <View style={[styles.progressDot, { backgroundColor: visualAcuity.skipped ? '#F57C00' : '#2E7D32' }]} />
            <View style={[styles.progressDotLine]} />
            <View style={[styles.progressDot, { backgroundColor: '#00ACC1' }]} />
            <View style={[styles.progressDotLine, { backgroundColor: '#E0E0E0' }]} />
            <View style={[styles.progressDot, { backgroundColor: '#E0E0E0' }]} />
          </View>
        </View>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setPhase('color-vision')}
          >
            <Text style={styles.primaryBtnText}>Start Color Vision Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={handleSkipCV}
          >
            <Text style={styles.ghostBtnText}>Skip This Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== COLOR VISION TEST =====
  if (phase === 'color-vision') {
    if (colorVision.completed) {
      setPhase('transition-astigmatism');
      return null;
    }

    return (
      <ColorVisionTest
        onComplete={handleCVComplete}
        onExit={handleCVExit}
      />
    );
  }

  // ===== TRANSITION: COLOR → ASTIGMATISM =====
  if (phase === 'transition-astigmatism') {
    return (
      <View style={styles.screenFlex}>
        <View style={styles.transitionBanner}>
          <Text style={styles.transitionCheckmark}>✓</Text>
          <Text style={styles.transitionTitle}>
            {colorVision.skipped ? 'Color Vision Skipped' : 'Color Vision Complete'}
          </Text>
        </View>

        <View style={styles.transitionBody}>
          <View style={styles.transitionCard}>
            <Text style={styles.transitionNextLabel}>Final Test</Text>
            <Text style={styles.transitionNextEmoji}>◎</Text>
            <Text style={styles.transitionNextTitle}>Astigmatism Screening</Text>
            <Text style={styles.transitionNextDesc}>
              Look at a dial of radiating lines and identify any that appear darker or clearer. Tests for directional focus imbalance.
            </Text>
            <Text style={styles.transitionNextTime}>~3 minutes</Text>
          </View>

          <View style={styles.progressDots}>
            <View style={[styles.progressDot, { backgroundColor: visualAcuity.skipped ? '#F57C00' : visualAcuity.completed ? '#2E7D32' : '#E0E0E0' }]} />
            <View style={[styles.progressDotLine]} />
            <View style={[styles.progressDot, { backgroundColor: colorVision.skipped ? '#F57C00' : '#2E7D32' }]} />
            <View style={[styles.progressDotLine]} />
            <View style={[styles.progressDot, { backgroundColor: '#00ACC1' }]} />
          </View>
        </View>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setPhase('astigmatism')}
          >
            <Text style={styles.primaryBtnText}>Start Astigmatism Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={handleSkipAstig}
          >
            <Text style={styles.ghostBtnText}>Skip This Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== ASTIGMATISM TEST =====
  if (phase === 'astigmatism') {
    if (astigmatism.completed) {
      setPhase('summary');
      return null;
    }

    return (
      <AstigmatismTest
        onComplete={handleAstigComplete}
        onExit={handleAstigExit}
      />
    );
  }

  // ===== SUMMARY SCREEN =====
  if (phase === 'summary') {
    const vaBadge = getStatusBadge(visualAcuity);
    const cvBadge = getStatusBadge(colorVision);
    const astBadge = getStatusBadge(astigmatism);

    // Extract key results for quick display
    const vaQuickResult = visualAcuity.results
      ? `RE: ${visualAcuity.results?.distanceResults?.rightEye?.acuity ?? '—'} / LE: ${visualAcuity.results?.distanceResults?.leftEye?.acuity ?? '—'}`
      : null;

    const cvQuickResult = colorVision.results
      ? `${colorVision.results.score}% — ${colorVision.results.deficiencyType === 'normal' ? 'Normal' : colorVision.results.deficiencyType}`
      : null;

    const astigQuickResult = astigmatism.results
      ? astigmatism.results.overallSuspicion === 'none'
        ? 'No astigmatism detected'
        : `${astigmatism.results.overallSuspicion.charAt(0).toUpperCase() + astigmatism.results.overallSuspicion.slice(1)} suspicion`
      : null;

    const allClear = completedCount > 0
      && (!visualAcuity.completed || (visualAcuity.results?.distanceResults?.rightEye?.decimal >= 0.5 && visualAcuity.results?.distanceResults?.leftEye?.decimal >= 0.5))
      && (!colorVision.completed || colorVision.results?.deficiencyType === 'normal')
      && (!astigmatism.completed || astigmatism.results?.overallSuspicion === 'none');

    const hasAnyConcern = !allClear && completedCount > 0;

    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={[styles.headerBanner, {
            backgroundColor: completedCount === 0 ? '#757575' : allClear ? '#2E7D32' : '#E65100',
          }]}>
            <TouchableOpacity style={styles.backArrow} onPress={handleExit}>
              <Text style={styles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>
              {completedCount === 0 ? '📋' : allClear ? '✅' : '⚠️'}
            </Text>
            <Text style={styles.headerTitle}>Screening Complete</Text>
            <Text style={styles.headerSubtitle}>
              {completedCount} of {totalTests} tests completed{skippedCount > 0 ? ` • ${skippedCount} skipped` : ''}
            </Text>
          </View>

          {/* Quick overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Results Summary</Text>

            {/* Visual Acuity */}
            <View style={styles.summaryTestRow}>
              <View style={styles.summaryTestIcon}>
                <Text style={{ fontSize: 24 }}>👓</Text>
              </View>
              <View style={styles.summaryTestInfo}>
                <Text style={styles.summaryTestName}>Visual Acuity</Text>
                {vaQuickResult ? (
                  <Text style={styles.summaryTestResult}>{vaQuickResult}</Text>
                ) : (
                  <Text style={[styles.summaryTestResult, { color: '#9E9E9E' }]}>
                    {visualAcuity.skipped ? 'Skipped' : 'Not completed'}
                  </Text>
                )}
              </View>
              <View style={[styles.summaryBadge, { backgroundColor: vaBadge.bg }]}>
                <Text style={[styles.summaryBadgeText, { color: vaBadge.color }]}>{vaBadge.label}</Text>
              </View>
            </View>

            <View style={styles.thinDivider} />

            {/* Color Vision */}
            <View style={styles.summaryTestRow}>
              <View style={styles.summaryTestIcon}>
                <Text style={{ fontSize: 24 }}>🎨</Text>
              </View>
              <View style={styles.summaryTestInfo}>
                <Text style={styles.summaryTestName}>Color Vision</Text>
                {cvQuickResult ? (
                  <Text style={styles.summaryTestResult}>{cvQuickResult}</Text>
                ) : (
                  <Text style={[styles.summaryTestResult, { color: '#9E9E9E' }]}>
                    {colorVision.skipped ? 'Skipped' : 'Not completed'}
                  </Text>
                )}
              </View>
              <View style={[styles.summaryBadge, { backgroundColor: cvBadge.bg }]}>
                <Text style={[styles.summaryBadgeText, { color: cvBadge.color }]}>{cvBadge.label}</Text>
              </View>
            </View>

            <View style={styles.thinDivider} />

            {/* Astigmatism */}
            <View style={styles.summaryTestRow}>
              <View style={styles.summaryTestIcon}>
                <Text style={{ fontSize: 24 }}>◎</Text>
              </View>
              <View style={styles.summaryTestInfo}>
                <Text style={styles.summaryTestName}>Astigmatism</Text>
                {astigQuickResult ? (
                  <Text style={styles.summaryTestResult}>{astigQuickResult}</Text>
                ) : (
                  <Text style={[styles.summaryTestResult, { color: '#9E9E9E' }]}>
                    {astigmatism.skipped ? 'Skipped' : 'Not completed'}
                  </Text>
                )}
              </View>
              <View style={[styles.summaryBadge, { backgroundColor: astBadge.bg }]}>
                <Text style={[styles.summaryBadgeText, { color: astBadge.color }]}>{astBadge.label}</Text>
              </View>
            </View>
          </View>

          {/* Overall assessment */}
          <View style={[styles.card, styles.assessmentCard, {
            borderLeftColor: completedCount === 0 ? '#757575' : allClear ? '#2E7D32' : '#E65100',
          }]}>
            <Text style={styles.cardTitle}>
              {allClear ? 'Overall Assessment' : hasAnyConcern ? '⚠️ Overall Assessment' : 'Assessment'}
            </Text>

            {completedCount === 0 ? (
              <Text style={styles.bodyText}>
                All tests were skipped. No screening data available. Consider running individual tests from the home screen.
              </Text>
            ) : allClear ? (
              <Text style={styles.bodyText}>
                All completed tests show results within normal range. No immediate vision concerns detected. Continue routine eye checkups every 1–2 years.
              </Text>
            ) : (
              <Text style={styles.bodyText}>
                One or more tests flagged potential concerns. We recommend consulting an eye care professional for a comprehensive examination. Detailed results for each test are shown above.
              </Text>
            )}

            {skippedCount > 0 && (
              <View style={[styles.tipBox, { marginTop: 12 }]}>
                <Text style={styles.tipText}>
                  💡 You skipped {skippedCount} test{skippedCount > 1 ? 's' : ''}. You can run {skippedCount > 1 ? 'them' : 'it'} individually from the home screen at any time.
                </Text>
              </View>
            )}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This is a screening tool, not a medical diagnosis. Results may vary with device, lighting, and testing conditions. Consult a qualified eye care professional for definitive assessment and treatment.
            </Text>
          </View>

          {/* Find Nearby Clinics CTA */}
          <TouchableOpacity
            style={styles.findClinicsCard}
            onPress={() => router.push('/clinics')}
            activeOpacity={0.8}
          >
            <Text style={styles.findClinicsEmoji}>🏥</Text>
            <View style={styles.findClinicsTextBlock}>
              <Text style={styles.findClinicsTitle}>Find Nearby Eye Clinics</Text>
              <Text style={styles.findClinicsDesc}>
                {hasAnyConcern
                  ? 'Get your results reviewed by a professional near you'
                  : skippedCount > 0
                  ? 'Complete your screening with a professional eye exam'
                  : 'Locate eye care professionals in your area'}
              </Text>
            </View>
            <Text style={styles.findClinicsArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleExit}
          >
            <Text style={styles.primaryBtnText}>Return Home</Text>
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
  thinDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },

  // ── Test Plan Cards ──
  testPlanCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testPlanNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00ACC1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  testPlanNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  testPlanInfo: {
    flex: 1,
  },
  testPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 3,
  },
  testPlanDesc: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
  },
  testPlanTime: {
    fontSize: 12,
    color: '#00838F',
    fontWeight: '600',
    marginTop: 4,
  },

  // ── Tip Box ──
  tipBox: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#00695C',
    lineHeight: 20,
  },

  // ── Transition Screens ──
  transitionBanner: {
    backgroundColor: '#2E7D32',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  transitionCheckmark: {
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  transitionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transitionBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  transitionCard: {
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
  transitionNextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00ACC1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  transitionNextEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  transitionNextTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 10,
    textAlign: 'center',
  },
  transitionNextDesc: {
    fontSize: 15,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  transitionNextTime: {
    fontSize: 14,
    color: '#00838F',
    fontWeight: '600',
  },

  // ── Progress Dots ──
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
  },
  progressDotLine: {
    width: 40,
    height: 3,
    backgroundColor: '#00ACC1',
    marginHorizontal: 4,
  },

  // ── Summary ──
  summaryTestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryTestIcon: {
    width: 40,
    alignItems: 'center',
  },
  summaryTestInfo: {
    flex: 1,
    marginLeft: 8,
  },
  summaryTestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  summaryTestResult: {
    fontSize: 13,
    color: '#616161',
    marginTop: 2,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  assessmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00ACC1',
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

  // ── Find Clinics CTA ──
  findClinicsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E0F7FA',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00ACC1',
    shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  findClinicsEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  findClinicsTextBlock: {
    flex: 1,
  },
  findClinicsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00838F',
    marginBottom: 3,
  },
  findClinicsDesc: {
    fontSize: 13,
    color: '#4DB6AC',
    lineHeight: 18,
  },
  findClinicsArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#00ACC1',
    marginLeft: 8,
  },
});
