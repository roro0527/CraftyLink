// src/ai/flows/suggest-super-parameters.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests super-parameters based on inputted URLs.
 *
 * - suggestSuperParameters - A function that takes an array of URLs and suggests super-parameters.
 * - SuggestSuperParametersInput - The input type for the suggestSuperParameters function, an array of URLs.
 * - SuggestSuperParametersOutput - The return type for the suggestSuperParameters function, an array of suggested super-parameters.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSuperParametersInputSchema = z.object({
  urls: z.array(z.string().url()).describe('An array of URLs to analyze.'),
});
export type SuggestSuperParametersInput = z.infer<typeof SuggestSuperParametersInputSchema>;

const SuggestSuperParametersOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the super-parameter.'),
    description: z.string().describe('A description of the super-parameter in Korean.'),
    values: z.array(z.string()).describe('The possible values for the super-parameter.'),
  })
);
export type SuggestSuperParametersOutput = z.infer<typeof SuggestSuperParametersOutputSchema>;

export async function suggestSuperParameters(input: SuggestSuperParametersInput): Promise<SuggestSuperParametersOutput> {
  return suggestSuperParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSuperParametersPrompt',
  input: {schema: SuggestSuperParametersInputSchema},
  output: {schema: SuggestSuperParametersOutputSchema},
  prompt: `You are an expert at identifying common parameters in URLs and suggesting "super-parameters" that represent combinations of those parameters.

  Analyze the following URLs and suggest a small number of super-parameters that would be useful for generating permutations of these URLs.

  URLs:
  {{#each urls}}
  - {{{this}}}
  {{/each}}

  Consider the following when suggesting super-parameters:
  - The super-parameters should be relevant to the purpose of the URLs.
  - The super-parameters should capture meaningful combinations of parameters and their possible values.
  - The super-parameters should be concise and easy to understand.
  - The description for each super-parameter must be in Korean.

  Return a JSON array of super-parameters, where each super-parameter has a name, description (in Korean), and an array of possible values.
  `,
});

const suggestSuperParametersFlow = ai.defineFlow(
  {
    name: 'suggestSuperParametersFlow',
    inputSchema: SuggestSuperParametersInputSchema,
    outputSchema: SuggestSuperParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
