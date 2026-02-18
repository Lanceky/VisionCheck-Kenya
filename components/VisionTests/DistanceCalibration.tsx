/**
 * DistanceCalibration.tsx
 * -----------------------
 * Shows distance instructions before a vision test, then proceeds.
 *
 * • **Distance mode (3 m)** — Tells the user to stand 3 metres away
 *   (~4 large steps) and gives practical tips.
 * • **Near mode (40 cm)** — Tells the user to hold the phone at
 *   arm's length (~40 cm) and gives reference tips.
 *
 * No sensors / GPS — just clear instructions, then "Start Test".
 */

import * as Speech from 'expo-speech';
import React, { useCallback, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

import { lockMaxBrightness } from '../../lib/brightnessService';
import { DISTANCE_TARGETS, type TestMode } from '../../lib/distanceService';

// ─── Props ───────────────────────────────────────────────────────────

interface Props {
  mode: TestMode;
  onCalibrated: () => void;
  onSkip?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export default function DistanceCalibration({ mode, onCalibrated, onSkip }: Props) {
  const target = DISTANCE_TARGETS[mode];

  // ── Brightness on mount ──
  useEffect(() => { lockMaxBrightness(); }, []);

  // ── Cleanup ──
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  // ── Start test ──
  const startTest = useCallback(() => {
    Vibration.vibrate([0, 100, 80, 100]);
    Speech.stop();
    Speech.speak('Starting test now.', { language: 'en', rate: 0.9 });
    setTimeout(() => onCalibrated(), 800);
  }, [onCalibrated]);

  // ═══════════════════════════════════════════════════════════════════
  // DISTANCE MODE — 3 metre instructions
  // ═══════════════════════════════════════════════════════════════════

  if (mode === 'distance') {
    return (
      <View style={st.root}>
        <View style={st.header}>
          <Text style={st.headerEmoji}>📏</Text>
          <Text style={st.headerTitle}>Distance Setup</Text>
          <Text style={st.headerSub}>Target: {target.label}</Text>
        </View>

        <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={st.instrTitle}>Before you begin</Text>

          <Text style={st.instrStep}>
            1.  The person being tested should <Text style={st.bold}>stand still</Text>.
          </Text>
          <Text style={st.instrStep}>
            2.  A helper takes the phone and walks{' '}
            <Text style={st.bold}>3 metres away</Text> (about 4 large steps).
          </Text>
          <Text style={st.instrStep}>
            3.  Face the screen towards the person being tested.
          </Text>
          <Text style={st.instrStep}>
            4.  Hand the phone to the person, or hold it steady at that distance.
          </Text>

          <View style={st.tipBox}>
            <Text style={st.tipTitle}>💡 How to estimate 3 metres</Text>
            <Text style={st.tipItem}>🚶  About 4 large adult steps</Text>
            <Text style={st.tipItem}>📏  A standard door is ~2 m tall — add half again</Text>
            <Text style={st.tipItem}>🛏️  Roughly the length of a single bed</Text>
            <Text style={st.tipItem}>📐  Use a tape measure for best accuracy</Text>
          </View>

          <TouchableOpacity style={st.startBtn} onPress={startTest}>
            <Text style={st.startBtnText}>✅  I'm at 3 Metres — Start Test</Text>
          </TouchableOpacity>
        </ScrollView>

        {onSkip && (
          <TouchableOpacity style={st.skipBtnBottom} onPress={onSkip}>
            <Text style={st.skipText}>Skip →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // NEAR MODE — 40 cm instructions
  // ═══════════════════════════════════════════════════════════════════

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.headerEmoji}>📐</Text>
        <Text style={st.headerTitle}>Near Distance Setup</Text>
        <Text style={st.headerSub}>Target: {target.label}</Text>
      </View>

      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={st.instrTitle}>Before you begin</Text>

        <Text style={st.instrStep}>
          1.  Hold the phone at <Text style={st.bold}>arm's length</Text> — about{' '}
          {target.label} from your eyes.
        </Text>
        <Text style={st.instrStep}>
          2.  The screen should be roughly at eye level.
        </Text>

        <View style={st.tipBox}>
          <Text style={st.tipTitle}>💡 How to estimate 40 cm</Text>
          <Text style={st.tipItem}>💪  Elbow to fingertips ≈ 40–45 cm</Text>
          <Text style={st.tipItem}>💳  5 credit cards end-to-end ≈ 42 cm</Text>
          <Text style={st.tipItem}>📄  A4 paper long edge (29.7 cm) + about a third more</Text>
        </View>

        <TouchableOpacity style={st.startBtn} onPress={startTest}>
          <Text style={st.startBtnText}>✅  I'm at 40 cm — Start Test</Text>
        </TouchableOpacity>
      </ScrollView>

      {onSkip && (
        <TouchableOpacity style={st.skipBtnBottom} onPress={onSkip}>
          <Text style={st.skipText}>Skip →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: '#00ACC1',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 32, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  body: { flex: 1, padding: 24 },
  instrTitle: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 16 },
  instrStep: { fontSize: 16, color: '#424242', lineHeight: 25, marginBottom: 12 },
  bold: { fontWeight: '700', color: '#00838F' },

  tipBox: {
    backgroundColor: '#E0F7FA',
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  tipTitle: { fontSize: 15, fontWeight: '700', color: '#00838F', marginBottom: 10 },
  tipItem: { fontSize: 14, color: '#424242', lineHeight: 22, marginBottom: 6 },

  startBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  skipBtnBottom: {
    paddingVertical: 14,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  skipText: { fontSize: 14, color: '#00838F', fontWeight: '600' },
});
