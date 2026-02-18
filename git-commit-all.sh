#!/bin/bash

# VisionCheck Kenya - Commit all updated files
# Generated: February 7, 2026

echo "🚀 Committing VisionCheck Kenya files..."

# App directory
git add app/index.tsx
git commit -m "Add home screen with test cards and navigation"

git add app/_layout.tsx
git commit -m "Configure expo-router navigation with screens"

git add app/test-suite.tsx
git commit -m "Add full screening orchestrator with results summary and clinic finder"

git add app/visual-acuity.tsx
git commit -m "Add standalone visual acuity test screen"

git add app/color-vision.tsx
git commit -m "Add standalone color vision test screen"

git add app/astigmatism.tsx
git commit -m "Add standalone astigmatism test screen"

git add app/clinics.tsx
git commit -m "Add GPS-based clinic finder with OpenStreetMap integration"

git add app/results.tsx
git commit -m "Add placeholder results screen"

git add app/history.tsx
git commit -m "Add placeholder history screen"

git add app/about.tsx
git commit -m "Add placeholder about screen"

git add app/eye-photo.tsx
git commit -m "Add placeholder eye photo screen"

# Components directory
git add components/VisionTests/VisualAcuityTest.tsx
git commit -m "Implement DPI-calibrated Snellen test with distance and near vision"

git add components/VisionTests/ColorVisionTest.tsx
git commit -m "Implement 14-plate Ishihara test with CIE chromaticity values"

git add components/VisionTests/AstigmatismTest.tsx
git commit -m "Implement 12-meridian astigmatic dial with axis calculation"

git add components/VisionTests/index.ts
git commit -m "Add vision test component exports"

# Configuration files
git add app.json
git commit -m "Add location permissions and expo-router configuration"

git add package.json
git commit -m "Add expo-location, expo-linking, and react-native-svg dependencies"

echo "✅ All files committed successfully!"
echo ""
echo "To push to remote:"
echo "  git push origin main"
