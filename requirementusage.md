# VisionCheck Kenya - Technology Requirements & Usage

This document explains the U.S.-based technologies used in VisionCheck Kenya, their purpose, and how they are integrated into the application.

---

## 🇺🇸 U.S.-Based Technologies

### 1. OpenAI GPT-4o-mini (Vision API)

**Company:** OpenAI (San Francisco, California, USA)

**What it is:**
OpenAI's GPT-4o-mini is a multimodal AI model capable of analyzing both text and images. The Vision API allows applications to send images and receive intelligent analysis.

**How we use it:**
- **Eye Photo Analysis:** When users capture photos of their eyes, the images are sent to OpenAI's Vision API
- **AI Screening:** The model analyzes eye images for visible abnormalities such as:
  - Redness or inflammation
  - Unusual pupil appearance
  - Cloudiness (potential cataracts)
  - Yellowing (jaundice indicators)
  - Visible irregularities
- **Recommendations:** Based on analysis, it provides personalized recommendations

**Integration:**
```typescript
// lib/aiService.ts
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: analysisPrompt },
        { type: 'image_url', image_url: { url: base64Image } }
      ]
    }
  ]
});
```

**Why this technology:**
- Industry-leading accuracy in image analysis
- Can understand medical context without specialized training
- Fast response times suitable for mobile apps
- Cost-effective for scale (mini model)

---

### 2. React Native / Expo

**Company:** Meta (Facebook) - Menlo Park, California, USA / Expo - Palo Alto, California, USA

**What it is:**
React Native is a JavaScript framework for building native mobile apps. Expo is a platform built on top of React Native that simplifies development and deployment.

**How we use it:**
- **Cross-Platform Development:** Single codebase for both Android and iOS
- **Native Performance:** Renders using native UI components
- **Expo SDK 54:** Provides pre-built modules for:
  - Camera access (`expo-camera`)
  - File system operations (`expo-file-system`)
  - Navigation (`expo-router`)
  - Secure storage (`expo-secure-store`)

**Key Dependencies:**
```json
{
  "expo": "~54.0.0",
  "react-native": "0.76.9",
  "expo-camera": "~16.1.6",
  "expo-router": "~4.1.8"
}
```

**Why this technology:**
- Fastest way to build production mobile apps
- Large ecosystem of libraries and components
- Over-the-air updates without app store resubmission
- Active community and Meta backing

---

### 3. Google Cloud Platform (Maps API)

**Company:** Google (Alphabet Inc.) - Mountain View, California, USA

**What it is:**
Google Maps Platform provides mapping, routing, and location services through APIs.

**How we use it:**
- **Clinic Finder:** Locates nearby eye care facilities
- **Directions:** Provides navigation to selected clinics
- **Geocoding:** Converts addresses to coordinates

**Integration:**
```typescript
// Opening Google Maps for directions
const query = encodeURIComponent(clinicName + ', Eldoret, Kenya');
Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
```

**Why this technology:**
- Most comprehensive mapping data for Kenya
- Familiar interface for users
- Reliable and fast globally

---

### 4. Appwrite

**Company:** Appwrite (Open Source, backed by U.S. investors including OSS Capital)

**What it is:**
Appwrite is an open-source Backend-as-a-Service (BaaS) platform that provides authentication, databases, storage, and serverless functions.

**How we use it:**
- **User Authentication:** Secure sign-up and login
- **Database:** Store test results and user profiles
- **File Storage:** Save eye photos securely
- **Real-time:** Sync data across devices

**Integration:**
```typescript
// lib/appwrite.ts
import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
```

**Why this technology:**
- Self-hostable for data sovereignty
- HIPAA-compliant capable
- No vendor lock-in
- Cost-effective for startups

---

### 5. TypeScript

**Company:** Microsoft - Redmond, Washington, USA

**What it is:**
TypeScript is a strongly-typed superset of JavaScript that compiles to plain JavaScript.

**How we use it:**
- **Type Safety:** Catch errors at compile time, not runtime
- **Better IDE Support:** Autocomplete and refactoring
- **Documentation:** Types serve as inline documentation
- **Maintainability:** Easier to understand and modify code

**Example:**
```typescript
interface VisionTestResult {
  eye: 'left' | 'right';
  distanceVision: string;    // e.g., "6/9"
  nearVision: string;        // e.g., "J2"
  hasMyopia: boolean;
  hasHyperopia: boolean;
}
```

**Why this technology:**
- Industry standard for large JavaScript projects
- Reduces bugs by 15-20% according to studies
- Required for professional React Native development

---

### 6. Node.js & npm

**Company:** OpenJS Foundation (Linux Foundation project, U.S.-based governance)

**What it is:**
Node.js is a JavaScript runtime, and npm is the package manager for JavaScript.

**How we use it:**
- **Development Environment:** Run build tools and scripts
- **Package Management:** Install and manage dependencies
- **Build Process:** Bundle the app for deployment

**Why this technology:**
- Universal standard for JavaScript development
- Largest package ecosystem in the world
- Fast and reliable

---

## 📊 Technology Stack Summary

| Layer | Technology | U.S. Company | Purpose |
|-------|------------|--------------|---------|
| **AI/ML** | OpenAI GPT-4o-mini | OpenAI (CA) | Eye photo analysis |
| **Frontend** | React Native | Meta (CA) | Mobile UI framework |
| **Platform** | Expo SDK 54 | Expo (CA) | Development platform |
| **Backend** | Appwrite | OSS/U.S. backed | Auth, DB, Storage |
| **Maps** | Google Maps API | Google (CA) | Clinic finder |
| **Language** | TypeScript | Microsoft (WA) | Type-safe JavaScript |
| **Runtime** | Node.js | OpenJS (U.S.) | Development runtime |

---

## 🔒 Data Privacy & Security

All U.S.-based technologies used comply with:
- **GDPR** - European data protection standards
- **Kenya Data Protection Act 2019** - Local compliance
- **HIPAA considerations** - Healthcare data best practices

**Data flow:**
1. Eye photos are processed by OpenAI and not stored on their servers (API mode)
2. User data is stored in Appwrite (can be self-hosted in Kenya)
3. No personal health information is shared with third parties

---

## 🚀 Why U.S. Technologies?

1. **Reliability:** Battle-tested at global scale
2. **Documentation:** Comprehensive guides and tutorials
3. **Community:** Large developer communities for support
4. **Innovation:** Access to cutting-edge AI capabilities
5. **Hackathon Requirement:** Red White & Build U.S.-Kenya Hackathon encourages U.S. technology integration

---

*VisionCheck Kenya - Built with American innovation for Kenyan impact* 🇺🇸🤝🇰🇪
