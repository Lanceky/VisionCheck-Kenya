import { EyeAnalysis, EyePhotoAnalysisResult } from '../components/VisionTests/EyePhotoCapture';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

interface OpenAIVisionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * AI Service for Eye Photo Analysis
 * Uses OpenAI Vision API to analyze eye photos
 */
class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Analyze a single eye photo using OpenAI Vision API
   */
  async analyzeEyePhoto(base64Image: string, eye: 'left' | 'right'): Promise<EyeAnalysis> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    console.log(`[AIService] Analyzing ${eye} eye photo with OpenAI Vision API...`);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant specialized in preliminary eye health screening for a mobile health app in Kenya called VisionCheck Kenya.

Analyze the provided eye photo and provide observations about visible eye health indicators.

CRITICAL GUIDELINES:
- This is a SCREENING tool only, NOT a diagnostic tool
- Always recommend professional consultation for any concerns
- Focus ONLY on visible external features
- Be conservative and careful in assessments
- Do not make definitive diagnoses
- Consider this is a mobile phone camera photo, so image quality may vary

ANALYZE FOR:
1. Cornea clarity - Look for cloudiness, scratches, or abnormalities
2. Sclera (white of eye) - Check for redness, yellowing, or spots
3. Pupil - Check shape, size, and symmetry
4. Iris - Look for any unusual patterns or growths
5. Conjunctiva - Check for inflammation or discharge
6. Eyelids/lashes - Look for swelling, crusting, or abnormalities
7. Blood vessels - Check for excessive redness or unusual patterns
8. General eye appearance - Overall health indicators

SCORING GUIDELINES:
- 85-100: Eye appears healthy with no visible concerns
- 70-84: Minor observations that should be monitored
- 50-69: Some concerns noted, professional exam recommended
- Below 50: Significant concerns, urgent professional consultation needed

You MUST respond with ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "healthScore": <number 0-100>,
  "observations": ["<positive finding 1>", "<positive finding 2>"],
  "concerns": ["<concern 1 if any>"],
  "confidence": "<high|medium|low>"
}`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this ${eye} eye photo for a preliminary health screening. Provide your analysis in the specified JSON format only.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
      });

      const data: OpenAIVisionResponse = await response.json();

      if (!response.ok) {
        console.error('[AIService] API Error:', data.error);
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }

      const content = data.choices[0]?.message?.content;
      console.log(`[AIService] Raw response for ${eye} eye:`, content);

      if (!content) {
        throw new Error('No content in API response');
      }

      // Parse JSON response - clean up potential markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]) as EyeAnalysis;
        console.log(`[AIService] Successfully analyzed ${eye} eye:`, analysis);
        return analysis;
      }

      throw new Error('Could not parse AI analysis response - invalid JSON format');
    } catch (error) {
      console.error(`[AIService] Error analyzing ${eye} eye photo:`, error);
      throw error;
    }
  }

  /**
   * Analyze both eye photos and generate comprehensive results
   */
  async analyzeEyePhotos(
    leftEyeBase64: string | null,
    rightEyeBase64: string | null,
    leftEyeUri: string,
    rightEyeUri: string
  ): Promise<EyePhotoAnalysisResult> {
    const results: EyePhotoAnalysisResult = {
      overallAssessment: '',
      recommendations: [],
      requiresProfessionalReview: false,
      timestamp: new Date(),
    };

    // Analyze left eye
    if (leftEyeBase64) {
      const leftAnalysis = await this.analyzeEyePhoto(leftEyeBase64, 'left');
      results.leftEye = {
        uri: leftEyeUri,
        analysis: leftAnalysis,
      };
    }

    // Analyze right eye
    if (rightEyeBase64) {
      const rightAnalysis = await this.analyzeEyePhoto(rightEyeBase64, 'right');
      results.rightEye = {
        uri: rightEyeUri,
        analysis: rightAnalysis,
      };
    }

    // Generate overall assessment
    results.overallAssessment = this.generateOverallAssessment(results);
    results.recommendations = this.generateRecommendations(results);
    results.requiresProfessionalReview = this.checkIfProfessionalReviewNeeded(results);

    return results;
  }

  /**
   * Generate overall assessment based on both eye analyses
   */
  private generateOverallAssessment(results: EyePhotoAnalysisResult): string {
    const leftScore = results.leftEye?.analysis.healthScore || 0;
    const rightScore = results.rightEye?.analysis.healthScore || 0;
    const avgScore = (leftScore + rightScore) / 2;

    const totalConcerns = [
      ...(results.leftEye?.analysis.concerns || []),
      ...(results.rightEye?.analysis.concerns || []),
    ];

    if (avgScore >= 80 && totalConcerns.length === 0) {
      return 'Your eyes appear healthy based on this preliminary screening. No significant concerns were detected in the visible external features.';
    } else if (avgScore >= 60) {
      return 'Your eyes appear generally healthy, though some minor observations were noted. Consider following up with an eye care professional for a comprehensive examination.';
    } else {
      return 'Some potential concerns were noted during this screening. We recommend scheduling an appointment with an eye care professional for a thorough evaluation.';
    }
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(results: EyePhotoAnalysisResult): string[] {
    const recommendations: string[] = [];

    const hasConcerns = 
      (results.leftEye?.analysis.concerns.length || 0) > 0 ||
      (results.rightEye?.analysis.concerns.length || 0) > 0;

    // Always include general recommendations
    recommendations.push('Schedule regular comprehensive eye exams (at least once every 2 years)');

    if (hasConcerns) {
      recommendations.push('Consider scheduling a professional eye examination soon');
    }

    // Add concern-specific recommendations
    const allConcerns = [
      ...(results.leftEye?.analysis.concerns || []),
      ...(results.rightEye?.analysis.concerns || []),
    ];

    if (allConcerns.some(c => c.toLowerCase().includes('dry') || c.toLowerCase().includes('redness'))) {
      recommendations.push('Use preservative-free lubricating eye drops as needed');
      recommendations.push('Ensure adequate hydration throughout the day');
    }

    if (allConcerns.some(c => c.toLowerCase().includes('strain') || c.toLowerCase().includes('fatigue'))) {
      recommendations.push('Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds');
      recommendations.push('Ensure proper lighting when reading or using screens');
    }

    // General eye health tips
    recommendations.push('Protect your eyes from UV rays with quality sunglasses');
    recommendations.push('Maintain a healthy diet rich in vitamins A, C, and E');

    return recommendations;
  }

  /**
   * Check if professional review is needed
   */
  private checkIfProfessionalReviewNeeded(results: EyePhotoAnalysisResult): boolean {
    const leftScore = results.leftEye?.analysis.healthScore || 100;
    const rightScore = results.rightEye?.analysis.healthScore || 100;
    const avgScore = (leftScore + rightScore) / 2;

    const totalConcerns = [
      ...(results.leftEye?.analysis.concerns || []),
      ...(results.rightEye?.analysis.concerns || []),
    ];

    return avgScore < 70 || totalConcerns.length >= 2;
  }

  /**
   * Get conversational AI guidance for eye health questions
   */
  async getGuidance(query: string, context?: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key is not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    console.log('[AIService] Getting AI guidance...');

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful eye health assistant for VisionCheck Kenya, a mobile app that provides 
vision screening services across Kenya. You help users understand their eye health and guide them through 
the screening process.

KEY RESPONSIBILITIES:
- Explain vision test results in simple, understandable terms
- Provide general eye health education
- Guide users to appropriate professional care when needed
- Be culturally sensitive to the Kenyan context
- Consider that users may have limited access to eye care professionals

GUIDELINES:
- Be friendly, warm, and reassuring
- Use simple language, avoiding medical jargon
- Always recommend professional consultation for medical concerns
- Keep responses concise (2-3 paragraphs max)
- Never diagnose conditions - only provide general information
- Encourage regular eye check-ups`
            },
            {
              role: 'user',
              content: context ? `Context: ${context}\n\nQuestion: ${query}` : query,
            },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      const data: OpenAIVisionResponse = await response.json();

      if (!response.ok) {
        console.error('[AIService] API Error:', data.error);
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }

      console.log('[AIService] Guidance received successfully');
      return content;
    } catch (error) {
      console.error('[AIService] Error getting AI guidance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
