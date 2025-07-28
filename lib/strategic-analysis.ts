import { GoogleGenAI } from '@google/genai';

/**
 * Strategic Analysis Layer - Enhances basic responses with intelligent insights
 */
export class StrategicAnalyzer {
  private genai: GoogleGenAI;

  constructor() {
    this.genai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || ''
    });
  }

  /**
   * Enhance a basic response with strategic insights
   */
  async enhanceResponse(
    userQuery: string,
    basicResponse: string,
    functionResults?: any[],
    userWallet?: string
  ): Promise<string> {
    // Only run on server side
    if (typeof window !== 'undefined') {
      return basicResponse;
    }

    // If the response is already strategic (contains emojis and structured analysis), return as-is
    if (this.isAlreadyStrategic(basicResponse)) {
      return basicResponse;
    }

    try {
      const enhancementPrompt = `
The user asked: "${userQuery}"

The system provided this basic response:
${basicResponse}

${functionResults ? `Raw function results: ${JSON.stringify(functionResults, null, 2)}` : ''}

User wallet: ${userWallet || 'Not connected'}

ENHANCE this response with strategic insights. Transform it from a basic answer into intelligent analysis that a professional DeFi advisor would provide.

**YOUR ENHANCED RESPONSE SHOULD INCLUDE:**
1. 📊 **Strategic Summary** - Key insights in clear language
2. 💡 **Market Intelligence** - What this means for the user's strategy
3. ⚠️ **Risk Assessment** - Important risks or considerations
4. 🎯 **Actionable Recommendations** - Specific next steps
5. 🔗 **Follow-up Opportunities** - Additional valuable actions

**EXAMPLES OF STRATEGIC ENHANCEMENT:**

Basic: "Your XLM balance is 1000 XLM"
Enhanced: "📊 **Portfolio Overview**: You have 1,000 XLM (~$120 at current prices)

💡 **Strategic Insight**: This is a solid foundation for DeFi strategies. XLM offers good lending opportunities on Blend with current yields around 8-12%.

⚠️ **Risk Assessment**: Consider diversifying across multiple assets and protocols to reduce concentration risk.

🎯 **Recommendations**: 
- Lend 70% (700 XLM) to high-yield Blend pools
- Keep 20% liquid for opportunities  
- Consider swapping 10% to USDC for stability

🔗 **Next Steps**: Check available Blend pools for XLM lending rates and compare with Soroswap LP opportunities."

**BE STRATEGIC, INSIGHTFUL, AND ACTIONABLE while maintaining the friendly Gemini AI tone.**
`;

      const result = await this.genai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: enhancementPrompt,
        config: {
          systemInstruction: "You are Gemini AI, an expert DeFi strategist. Enhance basic responses with professional financial insights while staying friendly and conversational.",
        },
      });

      return result.text?.trim() || basicResponse;

    } catch (error) {
      console.error('[Strategic Enhancement Error]:', error);
      return basicResponse; // Fallback to original response
    }
  }

  /**
   * Check if a response already contains strategic analysis
   */
  private isAlreadyStrategic(response: string): boolean {
    const strategicIndicators = [
      '📊', '💡', '⚠️', '🎯', '🔗',
      'Strategic', 'Risk Assessment', 'Recommendation',
      'Next Steps', 'Insight'
    ];
    
    return strategicIndicators.some(indicator => response.includes(indicator));
  }

  /**
   * Analyze multiple results and provide comprehensive strategic insights
   */
  async analyzeMultipleResults(
    userQuery: string,
    results: any[],
    userWallet?: string
  ): Promise<string> {
    // Only run on server side
    if (typeof window !== 'undefined') {
      return "Analysis complete - please review your results.";
    }

    if (!results || results.length === 0) {
      return "No results to analyze.";
    }

    try {
      const analysisPrompt = `
The user asked: "${userQuery}"

Multiple operations were executed with these results:
${JSON.stringify(results, null, 2)}

User wallet: ${userWallet || 'Not connected'}

Provide a COMPREHENSIVE STRATEGIC ANALYSIS that synthesizes all these results into actionable insights.

**YOUR ANALYSIS SHOULD INCLUDE:**
1. 📊 **Executive Summary** - Key findings across all operations
2. 💡 **Strategic Insights** - What the combined data reveals about opportunities
3. ⚠️ **Risk Analysis** - Comprehensive risk assessment across all positions/operations
4. 🎯 **Priority Recommendations** - Top 3 actions the user should take
5. 🔗 **Strategic Roadmap** - Suggested sequence of follow-up actions

**THINK LIKE A PROFESSIONAL DeFi PORTFOLIO MANAGER** - synthesize the data, identify patterns, assess risks, and provide a clear action plan.
`;

      const result = await this.genai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: analysisPrompt,
        config: {
          systemInstruction: "You are Gemini AI, an expert DeFi portfolio manager. Provide comprehensive strategic analysis that helps users make informed decisions.",
        },
      });

      return result.text?.trim() || "Analysis complete - please review your results.";

    } catch (error) {
      console.error('[Multi-Result Analysis Error]:', error);
      return "Analysis complete - please review your results.";
    }
  }
}

// Export singleton instance
export const strategicAnalyzer = new StrategicAnalyzer();