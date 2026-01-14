# VisionCheck Kenya

**Bringing eye screening to every smartphone in Kenya**

---

## The Problem

Millions of Kenyans live with uncorrected vision problems, not because treatment isn't available, but because they don't know they need it. Children struggle in school, labeled as slow learners when they simply can't see the blackboard. Adults live with constant headaches and reduced productivity, accepting blurry vision as normal.

In Eldoret and across Kenya, accessing basic eye screening means:
- Taking a day off work
- Traveling to urban centers (sometimes hours away)
- Paying consultation fees many families can't afford
- Waiting weeks or months for mobile eye camps

The result? Over 4 million Kenyans with treatable vision problems go undiagnosed.

---

## Our Solution

VisionCheck Kenya turns any smartphone into a comprehensive vision screening tool. No special equipment. No internet required. No medical training needed.

**In 5 minutes, users can:**
- Test visual acuity for both eyes
- Check for color vision deficiencies
- Capture eye photos for AI analysis
- Get clear recommendations on whether they need professional care
- Find nearby affordable eye clinics

---

## How It Works

### For Users
1. **Download the app** (works on Android & iOS)
2. **Follow simple guided instructions** in English or Swahili
3. **Complete vision tests** using your phone screen and camera
4. **Get instant results** with clear next steps
5. **Find local clinics** if follow-up care is needed

### For Community Health Workers & Teachers
- Screen entire classrooms or communities in minutes
- Track results over time
- Generate referral reports
- Connect people directly to care

---

## Technology Stack

**Frontend:**
- React Native / Expo (cross-platform mobile)
- Works offline with smart data syncing
- Accessible UI for users with varying literacy levels

**Backend:**
- Appwrite (database, storage, authentication)
- Secure health data storage compliant with privacy standards

**AI & Intelligence:**
- OpenAI GPT for conversational guidance
- OpenAI Vision API for eye photo analysis
- Custom algorithms for visual acuity calculation

**Integration:**
- Google Maps API for clinic finder
- SMS integration for appointment reminders
- Geolocation services

---


## Why This Project Matters

**For Children:**
Early detection prevents years of academic struggle. A child who can suddenly see clearly experiences immediate improvement in learning outcomes and confidence.

**For Adults:**
Improved work productivity, reduced headaches, safer driving, better quality of life. Many don't realize how much vision problems impact their daily activities.

**For Healthcare System:**
Shifts focus from expensive late-stage interventions (like cataract surgery) to affordable early intervention (glasses). Better resource allocation based on real data about where vision problems are concentrated.

---

## Getting Started (For Developers)

```bash
# Clone the repository
git clone https://github.com/Lanceky/Visioncheck-kenya.git

# Navigate to project directory
cd visioncheck-kenya

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app or run on emulator
```

### Prerequisites
- Node.js 16+
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS)
- Appwrite account (cloud.appwrite.io)
- OpenAI API key

### Configuration
Create a `.env` file with:
```
APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_project_id
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_maps_key
```

---

## Contributing

This project is being developed for the Red White & Build Hackathon. After the hackathon, we welcome contributions from:
- Healthcare professionals for medical validation
- Developers for feature enhancements
- Designers for UI/UX improvements
- Translators for additional language support
- Community organizers for pilot programs

---

## Medical Disclaimer

VisionCheck Kenya is a screening tool, not a diagnostic device. It helps identify people who may benefit from professional eye care but does not replace comprehensive eye examinations by licensed optometrists or ophthalmologists.

All users with abnormal screening results are advised to seek professional evaluation.

---

## Contact & Links

**Project Lead:** Evans Langat 
**Email:** evansklan100@gmail.com 
**Location:** Eldoret, Kenya

**Hackathon:** Red White & Build U.S.-Kenya Hackathon 2026  
**Category:** Health  
**Partners:** STEM Impact Center Kenya, U.S. Embassy Nairobi


---

*"Clear vision should be a right, not a privilege."*
