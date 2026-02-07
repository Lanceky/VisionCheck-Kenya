import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Svg, { Circle } from 'react-native-svg';

// ─── TYPES ───────────────────────────────────────────────────────────
type TestPhase =
  | 'welcome'
  | 'setup'
  | 'test'
  | 'results';

type DeficiencyType = 'protan' | 'deutan' | 'tritan' | 'normal';

interface PlateResult {
  plateIndex: number;
  plateNumber: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  category: string;
}

interface TestResults {
  totalPlates: number;
  correctCount: number;
  incorrectCount: number;
  score: number;
  deficiencyType: DeficiencyType;
  severity: 'none' | 'mild' | 'moderate' | 'strong';
  plateResults: PlateResult[];
}

interface Props {
  onComplete?: (results: TestResults) => void;
  onExit?: () => void;
}

// ─── SCREEN DIMENSIONS ──────────────────────────────────────────────
const { width } = Dimensions.get('window');
const PLATE_SIZE = Math.min(width - 32, 340);

// ─── CIE-STANDARD ISHIHARA COLOR DEFINITIONS ────────────────────────
//
// Colors based on CIE 1931 chromaticity coordinates for Ishihara plates.
// Background dots use multiple similar shades to create the pseudoisochromatic effect.
// The key principle: people with normal color vision see the number clearly,
// while those with color deficiencies see a different number or nothing.
//
// Plate types:
// - Demonstration: Everyone can read (plate 1)
// - Transformation: Normal sees X, deficient sees Y
// - Vanishing: Normal sees number, deficient sees nothing
// - Hidden: Deficient sees number, normal sees nothing
// - Diagnostic: Distinguishes protan vs deutan

// ─── DOT COLORS ─────────────────────────────────────────────────────
// Each plate has "figure" colors (the number) and "background" colors.
// Multiple shade variations simulate the Ishihara pseudoisochromatic effect.

const COLORS = {
  // Red-green confusion axis colors — saturated for clear figure visibility
  redOrange: ['#E24B2C', '#D94535', '#EE5530', '#D63B25', '#F06038'],
  greenOlive: ['#4E9A06', '#5DAE10', '#3D8B00', '#6BBF18', '#2E7D00'],
  
  // Background dot colors — matched luminance, different hue (confusing for colorblind)
  bgNeutral: ['#C6A040', '#BF983C', '#CEAA48', '#B89035', '#D6B450'],
  bgWarm: ['#CC8E3A', '#C48630', '#D49842', '#BC7E28', '#DCA04A'],
  bgCool: ['#A89248', '#9E8840', '#B29C50', '#968038', '#BAA458'],
  
  // Blue-yellow axis — saturated
  blueViolet: ['#5B3FA0', '#6B4DB0', '#4A2E90', '#7B5DC0', '#3A1E80'],
  yellowGreen: ['#C5B020', '#CDB828', '#BBA818', '#D5C030', '#B0A010'],
  
  // Demonstration plate (visible to everyone — high contrast)
  demoFigure: ['#E84030', '#D43828', '#F04838', '#CC3020', '#E85040'],
  demoBg: ['#5AAF5A', '#4CA04C', '#68BF68', '#3E903E', '#78CF78'],
  
  // Gray confusion colors for tritan testing
  grayBlue: ['#6888A8', '#7898B8', '#587898', '#88A8C8', '#486888'],
  grayYellow: ['#A89868', '#9E8E5E', '#B2A272', '#948454', '#BCAC7C'],
};

// ─── ISHIHARA PLATE DATA ────────────────────────────────────────────
// Based on the standard 14-plate screening edition.
// Each plate has a digit pattern, category, and what different vision types see.

interface IshiharaPlate {
  id: number;
  correctAnswer: string;        // What normal vision sees
  deficientAnswer: string;      // What red-green deficient sees (or 'nothing')
  category: 'demonstration' | 'vanishing' | 'transformation' | 'hidden-digit' | 'tritan';
  figureColors: string[];
  bgColors: string[];
  digit: number[][];             // 7x5 grid: 1 = figure dot, 0 = background dot
  description: string;
}

// Digit patterns — thicker strokes on larger grids for clear visibility
// Single digits: 9×7 grid with 2-cell-wide strokes
// Multi digits: wider grids with 2-cell-wide strokes
const DIGIT_PATTERNS: Record<string, number[][]> = {
  '2': [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [0,0,0,0,1,1,1],
    [0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0],
    [0,1,1,0,0,0,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
  ],
  '3': [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,1,1,1,1,0],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  '5': [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  '6': [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  '7': [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0],
  ],
  '8': [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [0,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  '9': [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [0,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  '12': [
    [0,1,1,0,0,0,1,1,1,1,0,0],
    [1,1,1,0,0,1,1,1,1,1,1,0],
    [1,1,1,0,1,1,0,0,0,1,1,0],
    [0,1,1,0,0,0,0,0,0,1,1,0],
    [0,1,1,0,0,0,0,0,1,1,0,0],
    [0,1,1,0,0,0,0,1,1,0,0,0],
    [0,1,1,0,0,0,1,1,0,0,0,0],
    [0,1,1,0,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,1,1,1,1,1,1],
  ],
  '15': [
    [0,1,1,0,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,0,0,0,0,0,0],
    [0,1,1,0,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,1,1,1,1,0],
    [0,1,1,0,0,0,0,0,0,1,1,0],
    [0,1,1,0,1,1,0,0,0,1,1,0],
    [0,1,1,0,1,1,1,1,1,1,1,0],
    [1,1,1,0,0,1,1,1,1,1,0,0],
  ],
  '16': [
    [0,1,1,0,0,1,1,1,1,1,0,0],
    [1,1,1,0,1,1,1,1,1,1,1,0],
    [1,1,1,0,1,1,0,0,0,0,0,0],
    [0,1,1,0,1,1,0,0,0,0,0,0],
    [0,1,1,0,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,1,1,1,1,0],
    [0,1,1,0,1,1,0,0,0,1,1,0],
    [0,1,1,0,1,1,1,1,1,1,1,0],
    [1,1,1,0,0,1,1,1,1,1,0,0],
  ],
  '29': [
    [0,1,1,1,1,0,0,0,1,1,1,1,0],
    [1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,0,0,1,1,0,1,1,0,0,1,1],
    [0,0,0,0,1,1,0,1,1,0,0,1,1],
    [0,0,0,1,1,0,0,0,1,1,1,1,1],
    [0,0,1,1,0,0,0,0,0,0,0,1,1],
    [0,1,1,0,0,0,0,0,0,0,0,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,0,1,1,1,1,0],
  ],
  '42': [
    [1,1,0,0,0,0,0,1,1,1,1,0,0],
    [1,1,0,0,0,0,1,1,1,1,1,1,0],
    [1,1,0,0,0,1,1,0,0,0,1,1,0],
    [1,1,0,1,1,0,0,0,0,0,1,1,0],
    [1,1,1,1,1,1,0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,1,1,1,1,1,1,1],
  ],
  '45': [
    [1,1,0,0,0,0,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,1,1,0,0,0,0,0],
    [1,1,0,1,1,0,1,1,1,1,1,1,0],
    [1,1,1,1,1,0,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0,0,0,0,0,1,1],
    [0,0,0,1,1,0,1,1,0,0,0,1,1],
    [0,0,0,1,1,0,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0,1,1,1,1,1,0],
  ],
  '57': [
    [1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,1,1,1,0,0,0,0,0,1,1,0],
    [1,1,1,1,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0],
  ],
  '74': [
    [1,1,1,1,1,1,0,1,1,0,0,0,0],
    [1,1,1,1,1,1,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,1,1,0],
    [0,0,0,1,1,0,0,1,1,1,1,1,0],
    [0,0,1,1,0,0,0,1,1,1,1,1,1],
    [0,0,1,1,0,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,0,0,1,1,0,0],
  ],
  '97': [
    [0,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,0,0,1,1,0,0,0,0,0,1,1],
    [1,1,0,0,1,1,0,0,0,0,1,1,0],
    [0,1,1,1,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0],
    [1,1,1,1,1,1,0,0,0,1,1,0,0],
    [0,1,1,1,1,0,0,0,0,1,1,0,0],
  ],
};

// 14-plate screening set based on standard Ishihara
const ISHIHARA_PLATES: IshiharaPlate[] = [
  {
    id: 1,
    correctAnswer: '12',
    deficientAnswer: '12',
    category: 'demonstration',
    figureColors: COLORS.demoFigure,
    bgColors: COLORS.demoBg,
    digit: DIGIT_PATTERNS['12'],
    description: 'Demonstration plate — visible to everyone',
  },
  {
    id: 2,
    correctAnswer: '8',
    deficientAnswer: '3',
    category: 'transformation',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgNeutral,
    digit: DIGIT_PATTERNS['8'],
    description: 'Red-green transformation plate',
  },
  {
    id: 3,
    correctAnswer: '6',
    deficientAnswer: '5',
    category: 'transformation',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgWarm,
    digit: DIGIT_PATTERNS['6'],
    description: 'Red-green transformation plate',
  },
  {
    id: 4,
    correctAnswer: '29',
    deficientAnswer: '70',
    category: 'vanishing',
    figureColors: COLORS.greenOlive,
    bgColors: COLORS.bgNeutral,
    digit: DIGIT_PATTERNS['29'],
    description: 'Red-green vanishing plate',
  },
  {
    id: 5,
    correctAnswer: '5',
    deficientAnswer: '2',
    category: 'transformation',
    figureColors: COLORS.greenOlive,
    bgColors: COLORS.bgWarm,
    digit: DIGIT_PATTERNS['5'],
    description: 'Red-green transformation plate',
  },
  {
    id: 6,
    correctAnswer: '3',
    deficientAnswer: '5',
    category: 'transformation',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgCool,
    digit: DIGIT_PATTERNS['3'],
    description: 'Red-green transformation plate',
  },
  {
    id: 7,
    correctAnswer: '15',
    deficientAnswer: '17',
    category: 'transformation',
    figureColors: COLORS.greenOlive,
    bgColors: COLORS.bgNeutral,
    digit: DIGIT_PATTERNS['15'],
    description: 'Red-green transformation plate',
  },
  {
    id: 8,
    correctAnswer: '74',
    deficientAnswer: '21',
    category: 'vanishing',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgWarm,
    digit: DIGIT_PATTERNS['74'],
    description: 'Red-green vanishing plate',
  },
  {
    id: 9,
    correctAnswer: '45',
    deficientAnswer: 'nothing',
    category: 'vanishing',
    figureColors: COLORS.greenOlive,
    bgColors: COLORS.bgCool,
    digit: DIGIT_PATTERNS['45'],
    description: 'Red-green vanishing plate',
  },
  {
    id: 10,
    correctAnswer: '7',
    deficientAnswer: 'nothing',
    category: 'vanishing',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgNeutral,
    digit: DIGIT_PATTERNS['7'],
    description: 'Red-green vanishing plate',
  },
  {
    id: 11,
    correctAnswer: '16',
    deficientAnswer: 'nothing',
    category: 'vanishing',
    figureColors: COLORS.greenOlive,
    bgColors: COLORS.bgWarm,
    digit: DIGIT_PATTERNS['16'],
    description: 'Red-green vanishing plate',
  },
  {
    id: 12,
    correctAnswer: '97',
    deficientAnswer: 'nothing',
    category: 'vanishing',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgCool,
    digit: DIGIT_PATTERNS['97'],
    description: 'Red-green vanishing plate',
  },
  {
    id: 13,
    correctAnswer: '42',
    deficientAnswer: '2',
    category: 'transformation',
    figureColors: COLORS.redOrange,
    bgColors: COLORS.bgNeutral,
    digit: DIGIT_PATTERNS['42'],
    description: 'Diagnostic — protan sees 2, deutan sees 4',
  },
  {
    id: 14,
    correctAnswer: '9',
    deficientAnswer: 'nothing',
    category: 'tritan',
    figureColors: COLORS.blueViolet,
    bgColors: COLORS.grayYellow,
    digit: DIGIT_PATTERNS['9'],
    description: 'Blue-yellow (tritan) screening plate',
  },
];

// ─── DOT GENERATION ─────────────────────────────────────────────────
// Generates a pseudoisochromatic plate with randomly sized and positioned dots.
// Dots inside the digit path use figure colors; others use background colors.

interface DotData {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const generatePlateDots = (plate: IshiharaPlate, plateSize: number): DotData[] => {
  const dots: DotData[] = [];
  const rand = seededRandom(plate.id * 1000 + 42);
  const grid = plate.digit;
  const rows = grid.length;
  const cols = grid[0].length;

  // Plate geometry
  const plateRadius = plateSize / 2;
  const padding = plateSize * 0.04;
  const innerRadius = plateRadius - padding;

  // ── Digit bounding box ──
  // Scale the digit to fill ~80% of the plate, keeping aspect ratio of the grid.
  // The grid aspect ratio varies (7 cols for single, 12-13 for double digits).
  const maxDigitSize = innerRadius * 1.65;
  const aspectRatio = cols / rows;
  let digitWidth: number, digitHeight: number;
  if (aspectRatio > 1) {
    digitWidth = maxDigitSize;
    digitHeight = maxDigitSize / aspectRatio;
  } else {
    digitHeight = maxDigitSize;
    digitWidth = maxDigitSize * aspectRatio;
  }
  const digitLeft = plateRadius - digitWidth / 2;
  const digitTop = plateRadius - digitHeight / 2;
  const cellW = digitWidth / cols;
  const cellH = digitHeight / rows;

  // ── Dot sizing ──
  // Smaller, denser dots = sharper digit edges.
  // Target: ~3-4 dots per cell width for clear strokes.
  const baseDotR = plateSize * 0.019;
  const dotVariance = plateSize * 0.005; // minimal variance

  const pickColor = (colors: string[]): string => {
    return colors[Math.floor(rand() * colors.length)];
  };

  // Center-point only check — no edge sampling, prevents bleed across boundaries
  const isInDigit = (x: number, y: number): boolean => {
    const col = Math.floor((x - digitLeft) / cellW);
    const row = Math.floor((y - digitTop) / cellH);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
    return grid[row][col] === 1;
  };

  // Check if dot fits inside the plate circle
  const isInsidePlate = (x: number, y: number, r: number): boolean => {
    const dx = x - plateRadius;
    const dy = y - plateRadius;
    return Math.sqrt(dx * dx + dy * dy) + r <= innerRadius;
  };

  // ── Dense hex-grid dot placement ──
  // Tight spacing = more dots per cell = smoother digit edges
  const dotSpacing = baseDotR * 2.15;
  const rowHeight = dotSpacing * 0.866; // hex packing row height
  let rowIdx = 0;

  for (let gy = padding + baseDotR; gy < plateSize - padding; gy += rowHeight) {
    const xOffset = (rowIdx % 2) * (dotSpacing / 2);
    for (let gx = padding + baseDotR + xOffset; gx < plateSize - padding; gx += dotSpacing) {
      // Very small jitter — just enough to look organic, not enough to blur edges
      const jitter = baseDotR * 0.25;
      const cx = gx + (rand() - 0.5) * jitter;
      const cy = gy + (rand() - 0.5) * jitter;
      const r = baseDotR + (rand() - 0.5) * dotVariance;

      if (isInsidePlate(cx, cy, r)) {
        const inDigit = isInDigit(cx, cy);
        const fill = inDigit
          ? pickColor(plate.figureColors)
          : pickColor(plate.bgColors);
        dots.push({ cx, cy, r: Math.max(r, baseDotR * 0.8), fill });
      }
    }
    rowIdx++;
  }

  return dots;
};

// ─── GENERATE ANSWER CHOICES ────────────────────────────────────────
const generateChoices = (correctAnswer: string, plateIndex: number): string[] => {
  const allDigits = ['2', '3', '5', '6', '7', '8', '9', '12', '15', '16', '29', '42', '45', '57', '74', '97'];
  const singleDigits = ['2', '3', '5', '6', '7', '8', '9'];
  const doubleDigits = ['12', '15', '16', '29', '42', '45', '57', '74', '97'];

  const isDouble = correctAnswer.length > 1;
  const pool = isDouble ? doubleDigits : singleDigits;

  const choices = new Set<string>();
  choices.add(correctAnswer);

  // Add the deficient answer if it's a number
  const plate = ISHIHARA_PLATES[plateIndex];
  if (plate.deficientAnswer !== 'nothing' && plate.deficientAnswer !== correctAnswer) {
    choices.add(plate.deficientAnswer);
  }

  // Fill to 4 choices
  const rand = seededRandom(plateIndex * 777 + 13);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  for (const d of shuffled) {
    if (choices.size >= 4) break;
    choices.add(d);
  }

  // If still not enough, pull from all
  for (const d of allDigits.sort(() => rand() - 0.5)) {
    if (choices.size >= 4) break;
    choices.add(d);
  }

  // Shuffle final choices
  return [...choices].sort(() => rand() - 0.5);
};

// ─── DIAGNOSIS ENGINE ───────────────────────────────────────────────
const diagnose = (results: PlateResult[]): { deficiencyType: DeficiencyType; severity: 'none' | 'mild' | 'moderate' | 'strong' } => {
  const totalScreening = results.filter(r => r.category !== 'demonstration');
  const rgPlates = results.filter(r =>
    r.category === 'vanishing' || r.category === 'transformation'
  );
  const tritanPlates = results.filter(r => r.category === 'tritan');

  const rgErrors = rgPlates.filter(r => !r.isCorrect).length;
  const tritanErrors = tritanPlates.filter(r => !r.isCorrect).length;
  const totalErrors = totalScreening.filter(r => !r.isCorrect).length;

  // Tritan check
  if (tritanErrors > 0 && rgErrors <= 1) {
    return { deficiencyType: 'tritan', severity: tritanErrors >= 1 ? 'moderate' : 'mild' };
  }

  // Red-green check
  if (rgErrors === 0) {
    return { deficiencyType: 'normal', severity: 'none' };
  }

  // Check protan vs deutan based on diagnostic plate (#13)
  const diagnosticPlate = results.find(r => r.plateIndex === 12);
  let defType: DeficiencyType = 'deutan'; // more common

  if (diagnosticPlate && !diagnosticPlate.isCorrect) {
    // If they saw just '2' → protan; if just '4' → deutan
    if (diagnosticPlate.userAnswer === '2') {
      defType = 'protan';
    } else {
      defType = 'deutan';
    }
  }

  // Severity
  const errorRate = rgErrors / rgPlates.length;
  let severity: 'mild' | 'moderate' | 'strong';
  if (errorRate <= 0.25) severity = 'mild';
  else if (errorRate <= 0.6) severity = 'moderate';
  else severity = 'strong';

  return { deficiencyType: defType, severity };
};

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function ColorVisionTest({ onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<TestPhase>('welcome');
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [plateResults, setPlateResults] = useState<PlateResult[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentPlate = ISHIHARA_PLATES[currentPlateIndex];
  const progress = ((currentPlateIndex) / ISHIHARA_PLATES.length) * 100;

  // ─── Memoized dots for current plate ──────────
  const currentDots = useMemo(
    () => generatePlateDots(currentPlate, PLATE_SIZE),
    [currentPlateIndex]
  );

  // ─── Memoized choices for current plate ───────
  const choices = useMemo(
    () => generateChoices(currentPlate.correctAnswer, currentPlateIndex),
    [currentPlateIndex]
  );

  // ─── Animations ─────────────────────────────
  const animateTransition = useCallback((callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 120);
  }, [fadeAnim]);

  // ─── System back button handling ─────────────
  const previousPhaseMap: Record<TestPhase, TestPhase | 'exit'> = {
    'welcome': 'exit',
    'setup': 'welcome',
    'test': 'setup',
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

  // ─── Handle answer ──────────────────────────
  const handleAnswer = (answer: string) => {
    const result: PlateResult = {
      plateIndex: currentPlateIndex,
      plateNumber: currentPlate.id,
      userAnswer: answer,
      correctAnswer: currentPlate.correctAnswer,
      isCorrect: answer === currentPlate.correctAnswer,
      category: currentPlate.category,
    };

    const newResults = [...plateResults, result];
    setPlateResults(newResults);

    if (currentPlateIndex < ISHIHARA_PLATES.length - 1) {
      animateTransition(() => setCurrentPlateIndex(prev => prev + 1));
    } else {
      // All plates done
      finishTest(newResults);
    }
  };

  const handleCantSee = () => {
    handleAnswer('nothing');
  };

  const finishTest = (results: PlateResult[]) => {
    const diagnosis = diagnose(results);
    const correctCount = results.filter(r => r.isCorrect).length;

    const finalResults: TestResults = {
      totalPlates: results.length,
      correctCount,
      incorrectCount: results.length - correctCount,
      score: Math.round((correctCount / results.length) * 100),
      deficiencyType: diagnosis.deficiencyType,
      severity: diagnosis.severity,
      plateResults: results,
    };

    setPhase('results');
    onComplete?.(finalResults);
  };

  // ─── Results computation ──────────────────────
  const getResults = (): TestResults => {
    const diagnosis = diagnose(plateResults);
    const correctCount = plateResults.filter(r => r.isCorrect).length;
    return {
      totalPlates: plateResults.length,
      correctCount,
      incorrectCount: plateResults.length - correctCount,
      score: Math.round((correctCount / plateResults.length) * 100),
      deficiencyType: diagnosis.deficiencyType,
      severity: diagnosis.severity,
      plateResults,
    };
  };

  const getDeficiencyLabel = (type: DeficiencyType): string => {
    switch (type) {
      case 'protan': return 'Protanopia (Red-weak)';
      case 'deutan': return 'Deuteranopia (Green-weak)';
      case 'tritan': return 'Tritanopia (Blue-yellow)';
      case 'normal': return 'Normal Color Vision';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'none': return '#2E7D32';
      case 'mild': return '#F9A825';
      case 'moderate': return '#E65100';
      case 'strong': return '#C62828';
      default: return '#757575';
    }
  };

  const getResultEmoji = (type: DeficiencyType): string => {
    return type === 'normal' ? '✅' : '⚠️';
  };

  // ─── RENDER ────────────────────────────────────

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
            <Text style={styles.headerEmoji}>🎨</Text>
            <Text style={styles.headerTitle}>Color Vision Test</Text>
            <Text style={styles.headerSubtitle}>Ishihara Pseudoisochromatic Screening</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What We'll Test</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔴🟢</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Red-Green Vision</Text>
                <Text style={styles.infoDesc}>Detects protanopia and deuteranopia — the most common color vision deficiencies (8% of males).</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔵🟡</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Blue-Yellow Vision</Text>
                <Text style={styles.infoDesc}>Screens for tritanopia — a rarer condition affecting blue-yellow color perception.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>3–5 Minutes</Text>
                <Text style={styles.infoDesc}>14 Ishihara-style plates. Identify the number hidden in each dot pattern.</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clinical Standard</Text>
            <Text style={styles.bodyText}>
              Based on the Ishihara 14-plate screening edition, the international standard for color vision testing used by ophthalmologists worldwide.
            </Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                🔬 Colors calibrated to CIE 1931 chromaticity standards for accurate pseudoisochromatic testing.
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
              <Text style={styles.stepText}>Set screen brightness to maximum for accurate colors</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
              <Text style={styles.stepText}>Ensure good indoor lighting (1,000–2,500 lux recommended)</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
              <Text style={styles.stepText}>Hold phone at 50–75 cm (~arm's length) from your eyes</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepCircle}><Text style={styles.stepNumber}>4</Text></View>
              <Text style={styles.stepText}>Disable any color filters, night mode, or blue light filters</Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                ⚠️ Night mode, blue light filters, or screen tints will invalidate the test. Please disable them before proceeding.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>How It Works</Text>
            <Text style={styles.bodyText}>
              You'll see circular plates filled with colored dots. A number is hidden within each plate. Tap the number you see, or "Can't See a Number" if you can't identify one.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.bodyText}>
              The first plate is a demonstration — everyone should be able to read it. This confirms your screen is displaying colors correctly.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBtnContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setCurrentPlateIndex(0);
              setPlateResults([]);
              setPhase('test');
            }}
          >
            <Text style={styles.primaryBtnText}>Begin Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== TEST SCREEN =====
  if (phase === 'test') {
    return (
      <View style={[styles.screen, styles.testScreen]}>
        {/* Header banner */}
        <View style={styles.eyeBanner}>
          <Text style={styles.eyeBannerText}>
            Plate {currentPlateIndex + 1} of {ISHIHARA_PLATES.length}
          </Text>
          <Text style={styles.eyeBannerSub}>
            {currentPlate.category === 'demonstration'
              ? 'Demonstration Plate'
              : currentPlate.category === 'tritan'
                ? 'Blue-Yellow Screening'
                : 'Red-Green Screening'}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>
            {currentPlateIndex + 1} / {ISHIHARA_PLATES.length}
          </Text>
        </View>

        {/* Plate display */}
        <View style={styles.plateArea}>
          <View style={styles.plateContainer}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Svg width={PLATE_SIZE} height={PLATE_SIZE} viewBox={`0 0 ${PLATE_SIZE} ${PLATE_SIZE}`}>
                {/* Plate background circle */}
                <Circle
                  cx={PLATE_SIZE / 2}
                  cy={PLATE_SIZE / 2}
                  r={PLATE_SIZE / 2 - 2}
                  fill="#E8E0D0"
                />
                {/* Dots */}
                {currentDots.map((dot, i) => (
                  <Circle
                    key={i}
                    cx={dot.cx}
                    cy={dot.cy}
                    r={dot.r}
                    fill={dot.fill}
                  />
                ))}
              </Svg>
            </Animated.View>
          </View>
        </View>

        {/* Fixed bottom: question, choices, can't-see */}
        <View style={styles.testBottomSection}>
          <Text style={styles.questionText}>What number do you see?</Text>

          <View style={styles.choicesGrid}>
            {choices.map((choice, idx) => (
              <TouchableOpacity
                key={`${choice}-${idx}`}
                style={styles.choiceBtn}
                onPress={() => handleAnswer(choice)}
              >
                <Text style={styles.choiceBtnText}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cantSeeBtn} onPress={handleCantSee}>
            <Text style={styles.cantSeeBtnText}>Can't See a Number</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== RESULTS SCREEN =====
  if (phase === 'results') {
    const results = getResults();
    const severityColor = getSeverityColor(results.severity);
    const emoji = getResultEmoji(results.deficiencyType);

    return (
      <View style={styles.screenFlex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
          <View style={[styles.headerBanner, {
            backgroundColor: results.deficiencyType === 'normal' ? '#2E7D32' : '#E65100',
          }]}>
            {onExit && (
              <TouchableOpacity style={styles.backArrow} onPress={onExit}>
                <Text style={styles.backArrowText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerEmoji}>{emoji}</Text>
            <Text style={styles.headerTitle}>Color Vision Results</Text>
            <Text style={styles.headerSubtitle}>Ishihara 14-Plate Screening</Text>
          </View>

          {/* Score card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Score</Text>

            <View style={styles.scoreCircleContainer}>
              <View style={[styles.scoreCircle, { borderColor: severityColor }]}>
                <Text style={[styles.scoreNumber, { color: severityColor }]}>{results.score}%</Text>
                <Text style={styles.scoreLabel}>
                  {results.correctCount}/{results.totalPlates} correct
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultEyeLabel}>Classification</Text>
              <Text style={[styles.resultAcuity, { color: severityColor, fontSize: 16 }]}>
                {getDeficiencyLabel(results.deficiencyType)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultEyeLabel}>Severity</Text>
              <Text style={[styles.resultRating, { color: severityColor }]}>
                {results.severity === 'none' ? 'No deficiency' : `${results.severity.charAt(0).toUpperCase() + results.severity.slice(1)} deficiency`}
              </Text>
            </View>
          </View>

          {/* Plate-by-plate breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Plate-by-Plate Results</Text>
            {results.plateResults.map((pr, idx) => (
              <View key={idx}>
                <View style={styles.plateResultRow}>
                  <View style={styles.plateResultLeft}>
                    <Text style={styles.plateResultNum}>Plate {pr.plateNumber}</Text>
                    <Text style={styles.plateResultCategory}>
                      {pr.category === 'demonstration' ? 'Demo' :
                       pr.category === 'tritan' ? 'Blue-Yellow' : 'Red-Green'}
                    </Text>
                  </View>
                  <View style={styles.plateResultRight}>
                    <Text style={styles.plateResultAnswer}>
                      {pr.userAnswer === 'nothing' ? '—' : pr.userAnswer}
                    </Text>
                    <Text style={[styles.plateResultStatus, {
                      color: pr.isCorrect ? '#2E7D32' : '#C62828',
                    }]}>
                      {pr.isCorrect ? '✓ Correct' : `✗ (was ${pr.correctAnswer})`}
                    </Text>
                  </View>
                </View>
                {idx < results.plateResults.length - 1 && <View style={styles.thinDivider} />}
              </View>
            ))}
          </View>

          {/* Diagnosis card */}
          <View style={[styles.card, styles.diagnosisCard, { borderLeftColor: severityColor }]}>
            <Text style={styles.cardTitle}>
              {results.deficiencyType === 'normal' ? 'Assessment' : '⚠️ Assessment'}
            </Text>

            {results.deficiencyType === 'normal' ? (
              <Text style={styles.diagnosisText}>
                Your color vision appears normal. You correctly identified numbers across all color axes tested, including red-green and blue-yellow plates. No signs of color vision deficiency were detected.
              </Text>
            ) : (
              <>
                <Text style={styles.diagnosisText}>
                  Results suggest a possible {results.severity}{' '}
                  {results.deficiencyType === 'protan' ? 'protan (red-weak)' :
                   results.deficiencyType === 'deutan' ? 'deutan (green-weak)' :
                   'tritan (blue-yellow)'} color vision deficiency.
                </Text>
                <View style={{ height: 12 }} />
                <Text style={styles.recommendTitle}>Recommendation</Text>
                <Text style={styles.recommendText}>
                  This screening suggests you may have difficulty distinguishing certain colors. Please consult an eye care professional for a comprehensive color vision evaluation using full Ishihara 38-plate or Farnsworth-Munsell 100 Hue tests.
                </Text>
              </>
            )}
          </View>

          {/* Methodology */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Methodology</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Test Standard</Text>
              <Text style={styles.summaryValue}>Ishihara 14-plate</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plate Categories</Text>
              <Text style={styles.summaryValue}>Demo, Vanishing, Transform</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Color Standard</Text>
              <Text style={styles.summaryValue}>CIE 1931 chromaticity</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Deficiency Types</Text>
              <Text style={styles.summaryValue}>Protan, Deutan, Tritan</Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This is a screening tool, not a medical diagnosis. Smartphone screens may not reproduce Ishihara colors with full clinical accuracy. Results may vary with screen calibration, brightness, and ambient lighting. Consult a qualified eye care professional for definitive testing.
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
              setCurrentPlateIndex(0);
              setPlateResults([]);
              setPhase('test');
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
  thinDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
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

  // ── Eye/Plate Banner ──
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

  // ── Plate Display ──
  plateArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Test Bottom Section ──
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
    marginTop: 8,
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
    fontSize: 22,
    fontWeight: '600',
    color: '#00838F',
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

  // ── Results ──
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  resultEyeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  resultAcuity: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  resultRating: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Plate Results Breakdown ──
  plateResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  plateResultLeft: {
    flex: 1,
  },
  plateResultNum: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
  },
  plateResultCategory: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 1,
  },
  plateResultRight: {
    alignItems: 'flex-end',
  },
  plateResultAnswer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  plateResultStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
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
