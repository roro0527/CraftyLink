
'use server';
/**
 * @fileOverview Fetches regional trend data.
 *
 * - getRegionalTrends - Fetches related keywords and videos for a given keyword and region.
 * - RegionalTrendsInput - The input type for the getRegionalTrends function.
 * - RegionalTrendsOutput - The return type for the getRegionalTrends function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getYoutubeVideos, type YoutubeVideosData } from './youtube-videos-flow';

const RegionalTrendsInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  region: z.string().describe('The region code (e.g., US for United States).'),
  countryName: z.string().describe('The display name of the country (e.g., 미국).'),
});
export type RegionalTrendsInput = z.infer<typeof RegionalTrendsInputSchema>;

const RelatedKeywordsSchema = z.object({
    keywords: z.array(z.string()).describe('A list of 5 related keywords.'),
});

const RegionalTrendsOutputSchema = z.object({
  relatedKeywords: z.array(z.string()).describe('A list of related keywords for the region.'),
  relatedVideos: z.custom<YoutubeVideosData>().describe('A list of related YouTube videos.')
});
export type RegionalTrendsOutput = z.infer<typeof RegionalTrendsOutputSchema>;


const relatedKeywordsPrompt = ai.definePrompt({
    name: 'regionalRelatedKeywordsPrompt',
    input: { schema: z.object({ keyword: z.string(), countryName: z.string() }) },
    output: { schema: RelatedKeywordsSchema },
    prompt: `
      You are a marketing expert.
      Generate 5 related search terms for the given keyword, specifically for the given country.
      The answer should only contain the list of keywords.
      
      Keyword: {{{keyword}}}
      Country: {{{countryName}}}
    `,
});


const getRegionalTrendsFlow = ai.defineFlow(
  {
    name: 'getRegionalTrendsFlow',
    inputSchema: RegionalTrendsInputSchema,
    outputSchema: RegionalTrendsOutputSchema,
  },
  async (input) => {
    
    const { keyword, region, countryName } = input;
    
    try {
      const relatedKeywordsPromise = async () => {
         try {
            const { output } = await relatedKeywordsPrompt({ keyword, countryName });
            return output?.keywords || [];
         } catch (e) {
            console.error('Error generating related keywords', e);
            return [];
         }
      };

      const relatedVideosPromise = getYoutubeVideos({ 
          keyword: `${keyword} ${countryName}`
      });

      const [relatedKeywords, relatedVideos] = await Promise.all([
          relatedKeywordsPromise(),
          relatedVideosPromise
      ]);

      return {
        relatedKeywords,
        relatedVideos,
      };

    } catch (error) {
      console.error(`Error fetching regional trends for ${keyword} in ${region}:`, error);
      return {
        relatedKeywords: [],
        relatedVideos: [],
      };
    }
  }
);

export async function getRegionalTrends(input: RegionalTrendsInput): Promise<RegionalTrendsOutput> {
  return getRegionalTrendsFlow(input);
}
