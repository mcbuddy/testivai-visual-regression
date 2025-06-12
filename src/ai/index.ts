/**
 * AI integration placeholder for TestivaiVR Visual Regression
 */

// This is a placeholder file
// The actual implementation will be added in Phase 2

/**
 * Interface for AI model integration
 */
export interface AIModel {
  /**
   * Analyze visual differences between two images
   * @param baselinePath Path to the baseline image
   * @param comparePath Path to the comparison image
   * @returns Analysis result
   */
  analyzeVisualDifferences(baselinePath: string, comparePath: string): Promise<AIAnalysisResult>;
}

/**
 * Result of AI analysis
 */
export interface AIAnalysisResult {
  /**
   * Whether the differences are significant
   */
  isSignificant: boolean;
  
  /**
   * Confidence score (0-1)
   */
  confidence: number;
  
  /**
   * Description of the differences
   */
  description: string;
  
  /**
   * Areas of interest in the image
   */
  areasOfInterest?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    description: string;
  }>;
}

/**
 * Placeholder function for registering an external AI model
 */
export const registerAIModel = (model: AIModel): void => {
  console.log('AI model registered (placeholder)', model);
};
