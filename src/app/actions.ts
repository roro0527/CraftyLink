'use server';

import { suggestSuperParameters } from '@/ai/flows/suggest-super-parameters';
import type { SuperParam } from '@/lib/types';
import {nanoid} from 'nanoid';

export async function suggestSuperParametersAction(
  urls: string[]
): Promise<Omit<SuperParam, 'id'>[]> {
  if (!urls || urls.length === 0) {
    return [];
  }
  
  try {
    const suggestions = await suggestSuperParameters({ urls });
    // The AI might return null or an empty object.
    if (!suggestions) return [];
    return suggestions;
  } catch (error) {
    console.error('Error suggesting super-parameters:', error);
    throw new Error('AI로부터 제안을 받아오지 못했습니다. 다시 시도해주세요.');
  }
}
