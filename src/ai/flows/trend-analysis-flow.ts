
'use server';
/**
 * @fileOverview A keyword trend analysis AI agent.
 *
 * - analyzeKeywordTrends - A function that analyzes trend data for multiple keywords.
 * - TrendAnalysisInput - The input type for the analyzeKeywordTrends function.
 * - TrendAnalysisData - The return type for the analyzeKeywordTrends function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { KeywordTrendPoint } from '@/lib/types';

const KeywordTrendPointSchema = z.object({
  date: z.string().describe('The date for the data point (YYYY-MM-DD).'),
  value: z.number().describe('The search trend value.'),
});

const TrendAnalysisInputSchema = z.object({
  trendData: z.record(z.string(), z.array(KeywordTrendPointSchema))
    .describe('An object where keys are keywords and values are their trend data arrays.'),
});
export type TrendAnalysisInput = z.infer<typeof TrendAnalysisInputSchema>;

const KeywordAnalysisSchema = z.object({
  surgeRate: z.number().describe('The percentage growth from the first to the last data point. Can be negative.'),
  isDominant: z.boolean().describe('Whether this keyword is considered the most dominant among the compared keywords.'),
  reason: z.string().describe('A brief (one-sentence) explanation for the dominance assessment.'),
});

const TrendAnalysisDataSchema = z.record(z.string(), KeywordAnalysisSchema);
export type TrendAnalysisData = z.infer<typeof TrendAnalysisDataSchema>;

const analysisPrompt = ai.definePrompt({
    name: 'trendAnalysisPrompt',
    input: { schema: TrendAnalysisInputSchema },
    output: { schema: TrendAnalysisDataSchema },
    prompt: `You are a trend analysis expert. Based on the provided time-series data for multiple keywords, perform an analysis for each keyword.

Analyze the following data:
{{#each trendData}}
- Keyword: {{@key}}
  - Data: {{json this}}
{{/each}}

For each keyword, calculate the 'surgeRate'. The surgeRate is the percentage change from the average of the first half of the data points to the average of the second half.
To calculate it:
1. Sort the data points by date.
2. Split the data points into a first half and a second half. If there's an odd number of points, the extra point goes to the second half.
3. Calculate the average search value for each half.
4. The surgeRate is ((second_half_average - first_half_average) / first_half_average) * 100.
5. If the first_half_average is 0, treat it as 1 to avoid division by zero.

Then, determine which single keyword is 'dominant'. A dominant keyword typically has the highest average search volume and has been the top keyword for the most number of days. Set 'isDominant' to true for only one keyword, and false for all others.

Finally, provide a brief, one-sentence 'reason' for your dominance assessment for each keyword, explaining why it is or is not dominant compared to the others.

Return the analysis in the specified JSON format.`,
});


const analyzeKeywordTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeKeywordTrendsFlow',
    inputSchema: TrendAnalysisInputSchema,
    outputSchema: TrendAnalysisDataSchema,
  },
  async (input) => {
    // If there's only one keyword, AI analysis for dominance is not meaningful.
    // We can just calculate the surge rate directly.
    const keywords = Object.keys(input.trendData);
    if (keywords.length <= 1) {
        const result: TrendAnalysisData = {};
        for (const keyword of keywords) {
            const trends = input.trendData[keyword];
            let surgeRate = 0;
            if (trends && trends.length > 1) {
                const midPoint = Math.floor(trends.length / 2);
                const firstHalf = trends.slice(0, midPoint);
                const secondHalf = trends.slice(midPoint);
                
                const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / (firstHalf.length || 1);
                const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / (secondHalf.length || 1);

                const divisor = firstHalfAvg || 1; // Avoid division by zero
                surgeRate = ((secondHalfAvg - firstHalfAvg) / divisor) * 100;
            }
            result[keyword] = {
                surgeRate: Math.round(surgeRate),
                isDominant: true,
                reason: '단일 키워드는 항상 우세합니다.'
            };
        }
        return result;
    }

    const { output } = await analysisPrompt(input);
    return output!;
  }
);

export async function analyzeKeywordTrends(input: TrendAnalysisInput): Promise<TrendAnalysisData> {
  return analyzeKeywordTrendsFlow(input);
}
