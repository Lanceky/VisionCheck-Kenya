#!/bin/bash

# VisionCheck Kenya - Git Commit Commands
# Generated: February 1, 2026
# IMPORTANT: Hardcoded API key removed from lib/aiService.ts

echo "Starting git commits for VisionCheck Kenya..."

# 1. Core configuration files
git add .gitignore
git commit -m "chore: add .gitignore to exclude sensitive files and build artifacts"

git add .env.example
git commit -m "docs: add .env.example with API key configuration template"

git add package.json package-lock.json
git commit -m "chore: add project dependencies (React Native, Expo, OpenAI, Appwrite)"

git add tsconfig.json eslint.config.js
git commit -m "chore: add TypeScript and ESLint configuration"

git add app.json
git commit -m "chore: add Expo app configuration"

# 2. Documentation files
git add README.md
git commit -m "docs: update README with project overview and setup instructions"

git add presentation.md
git commit -m "docs: add 6-slide Gamma presentation prompt for hackathon pitch"

git add presenta.md
git commit -m "docs: add presentation talking points for 4 main sections"

git add requirementusage.md
git commit -m "docs: document U.S.-based technologies and API integrations"

# 3. Backend services (NO SENSITIVE DATA)
git add lib/aiService.ts
git commit -m "feat: integrate OpenAI GPT-4o-mini Vision API for eye photo analysis

- Remove hardcoded API key (uses env variable only)
- Implement structured eye health analysis
- Support both eyes with severity scoring
- Add detailed recommendations based on findings"

git add lib/appwrite.ts
git commit -m "feat: configure Appwrite backend services

- Setup authentication service
- Configure database and storage
- All credentials use environment variables"

git add lib/authService.ts
git commit -m "feat: implement user authentication service with Appwrite"

# 4. Vision test components
git add components/VisionTests/VisualAcuityTest.tsx
git commit -m "feat: implement visual acuity test with 6/x metric scale

- Two-phase testing (distance + near vision)
- Detect myopia and hyperopia
- Use Kenya-standard 6/x scale (not US 20/x)
- Support both left and right eye testing"

git add components/VisionTests/ColorVisionTest.tsx
git commit -m "feat: implement Ishihara-style color vision test

- 4-plate screening for color blindness
- Detect red-green and blue-yellow deficiencies
- Simple high-contrast number display
- Voice assistant removed per requirements"

git add components/VisionTests/AstigmatismTest.tsx
git commit -m "feat: add astigmatism detection test with clock dial pattern

- 12-position clock dial for corneal irregularity detection
- Two-phase testing (clarity assessment + line selection)
- Severity levels: none/mild/moderate/significant
- Identify affected axes for clinical reference"

git add components/VisionTests/EyePhotoCapture.tsx
git commit -m "feat: implement AI-powered eye photo capture and analysis

- Use back camera for eye photography
- Real-time OpenAI Vision API integration
- Structured health scoring and recommendations
- Support bilateral eye analysis"

git add components/VisionTests/VisionTestSuite.tsx
git commit -m "feat: create comprehensive vision test orchestration suite

- Coordinate 4 test types (acuity, color, astigmatism, eye photo)
- Sequential bilateral eye testing
- Progress tracking and result aggregation
- Clean UX flow with clear instructions"

git add components/VisionTests/index.ts
git commit -m "chore: export all vision test components"

# 5. App screens
git add app/_layout.tsx
git commit -m "feat: setup app navigation with Expo Router"

git add app/index.tsx
git commit -m "feat: create home screen with 2-column test grid

- Display Visual Acuity, Color Vision, Astigmatism, Eye Photo cards
- Quick access to clinic finder
- Show 5-minute screening CTA
- 2-column responsive grid layout"

git add app/test-suite.tsx
git commit -m "feat: add test suite orchestration screen"

git add app/results.tsx
git commit -m "feat: create results screen with comprehensive test outcomes

- Display visual acuity for both eyes
- Show color vision and astigmatism results
- Present AI eye photo analysis
- Provide actionable recommendations"

git add app/clinics.tsx
git commit -m "feat: implement clinic finder with Google Maps integration

- Show nearby eye care facilities
- 2-column grid of quick test access cards
- Call and directions functionality
- Display ratings and contact info"

git add app/history.tsx
git commit -m "feat: add test history tracking screen"

git add app/about.tsx
git commit -m "feat: create about screen with app information"

git add app/eye-photo.tsx
git commit -m "feat: add standalone eye photo capture screen"

# 6. Assets
git add assets/
git commit -m "assets: add app icons and splash screens"

# 7. VS Code settings (optional, safe to commit)
git add .vscode/
git commit -m "chore: add VS Code workspace settings"

echo ""
echo "✅ All commits prepared!"
echo ""
echo "⚠️  SECURITY CHECK:"
echo "   - Hardcoded API key removed from lib/aiService.ts"
echo "   - .env files are gitignored"
echo "   - Only .env.example (template) is committed"
echo ""
echo "📤 To push to GitHub, run:"
echo "   git push origin main"
