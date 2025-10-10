import { genkit, firebase } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { firebase } from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [googleAI(), firebase()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
