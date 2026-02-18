# VisionCheck Kenya - Complete Project Files

## Project Overview
VisionCheck Kenya is a mobile eye screening app built with React Native (Expo), featuring three clinical vision tests and a GPS-based clinic finder using OpenStreetMap.

---

## Directory Structure

```
VisionCheck-Kenya/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root navigation layout
│   ├── index.tsx                # Home screen
│   ├── test-suite.tsx           # Full screening orchestrator
│   ├── visual-acuity.tsx        # Standalone VA test
│   ├── color-vision.tsx         # Standalone CV test
│   ├── astigmatism.tsx          # Standalone astigmatism test
│   ├── clinics.tsx              # Clinic finder with GPS + OpenStreetMap
│   ├── results.tsx              # Results viewer
│   ├── history.tsx              # Test history
│   ├── about.tsx                # About page
│   └── eye-photo.tsx            # Eye photo capture
│
├── components/
│   └── VisionTests/
│       ├── VisualAcuityTest.tsx     # VA test component
│       ├── ColorVisionTest.tsx       # Ishihara test component
│       ├── AstigmatismTest.tsx       # Astigmatism dial component
│       ├── CompleteScreeningFlow.tsx # Not implemented
│       ├── EyePhotoCapture.tsx       # Not implemented
│       ├── EyeAnalysisResults.tsx    # Not implemented
│       ├── VisionTestSuite.tsx       # Not implemented
│       └── index.ts                  # Component exports
│
├── assets/                      # Images, fonts
├── lib/                         # Utility functions
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript config
```

---

## Core Configuration Files

### `app.json`
```json
{
  "expo": {
    "name": "VisionCheck Kenya",
    "slug": "visioncheck-kenya",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.visioncheck.kenya",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "VisionCheck Kenya needs your location to find nearby eye clinics and opticians.",
        "NSCameraUsageDescription": "VisionCheck Kenya needs camera access to capture eye photos for analysis."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.visioncheck.kenya",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-splash-screen",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "VisionCheck Kenya needs your location to find nearby eye clinics and opticians."
        }
      ]
    ],
    "scheme": "visioncheck",
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### `package.json` (Key Dependencies)
```json
{
  "name": "visioncheck-kenya",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~6.0.22",
    "react": "18.3.1",
    "react-native": "0.81.5",
    "react-native-svg": "15.10.0",
    "expo-location": "~18.0.11",
    "expo-linking": "~8.0.11",
    "expo-status-bar": "~2.0.0",
    "typescript": "~5.9.2"
  }
}
```

---

## Implementation Status

### ✅ Completed Features

1. **Visual Acuity Test** (`components/VisionTests/VisualAcuityTest.tsx`)
   - Distance vision (Snellen 6/6 to 6/60)
   - Near vision (Jaeger N5 to N48)
   - DPI-calibrated letter sizing
   - Both eyes tested separately
   - Results classification (myopia/hypermetropia/normal)

2. **Color Vision Test** (`components/VisionTests/ColorVisionTest.tsx`)
   - 14 Ishihara pseudoisochromatic plates
   - CIE-standard chromaticity values
   - Procedurally generated dot patterns
   - Protan, deutan, tritan detection
   - Severity classification

3. **Astigmatism Test** (`components/VisionTests/AstigmatismTest.tsx`)
   - 12-meridian astigmatic dial
   - Two rounds per eye for consistency
   - Axis calculation (0°-180°)
   - Severity assessment
   - ISO 8596 compliance

4. **Test Suite Orchestrator** (`app/test-suite.tsx`)
   - Sequential test flow
   - Skip functionality
   - Unified results summary
   - Clinic finder integration

5. **Clinic Finder** (`app/clinics.tsx`)
   - GPS location acquisition
   - Overpass API (OpenStreetMap) integration
   - Real-time clinic search
   - Distance sorting (10 nearest results)
   - Category filtering (hospitals/optical/specialist/community)
   - Google Maps directions
   - Phone dialer integration

6. **Home Screen** (`app/index.tsx`)
   - Feature card grid
   - Individual test launch
   - Full screening launch
   - Navigation to all features

### ❌ Not Implemented

- Eye Photo Capture
- Test History
- Results Viewer
- About Page
- Appwrite backend integration

---

## Key Technical Details

### Styling Theme
- **Primary**: `#00ACC1` (cyan)
- **Dark**: `#00838F`
- **Light**: `#E0F7FA`
- **Success**: `#2E7D32`
- **Warning**: `#E65100`

### Clinical Standards
- **Visual Acuity**: Snellen standard, 3m distance, LogMAR converted
- **Color Vision**: Ishihara method, CIE 1931 xy chromaticity
- **Astigmatism**: ISO 8596, 12 meridians at 15° intervals

### APIs Used
- **Overpass API**: `https://overpass-api.de/api/interpreter` (OpenStreetMap data)
- **expo-location**: GPS, reverse geocoding
- **expo-linking**: Google Maps, phone dialer

---

## File Size Summary

| File | Lines | Status |
|------|-------|--------|
| `app/index.tsx` | ~400 | ✅ Complete |
| `app/test-suite.tsx` | ~900 | ✅ Complete |
| `app/clinics.tsx` | ~990 | ✅ Complete |
| `components/VisionTests/VisualAcuityTest.tsx` | ~1650 | ✅ Complete |
| `components/VisionTests/ColorVisionTest.tsx` | ~1580 | ✅ Complete |
| `components/VisionTests/AstigmatismTest.tsx` | ~1770 | ✅ Complete |
| `app/_layout.tsx` | ~120 | ✅ Complete |
| `app/visual-acuity.tsx` | ~40 | ✅ Wrapper |
| `app/color-vision.tsx` | ~40 | ✅ Wrapper |
| `app/astigmatism.tsx` | ~40 | ✅ Wrapper |

**Total operational code**: ~7,500 lines

---

## Running the Project

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## Demo Video Script

See separate narration document for 2-minute walkthrough.

---

*Generated: February 7, 2026*
*VisionCheck Kenya — Red White & Build U.S.-Kenya Hackathon 2026*
