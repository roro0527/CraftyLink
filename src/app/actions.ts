'use server';

import type { SuperParam } from '@/lib/types';
import {nanoid} from 'nanoid';

export async function suggestSuperParametersAction(
  urls: string[]
): Promise<Omit<SuperParam, 'id'>[]> {
  if (!urls || urls.length === 0) {
    return [];
  }
  
  try {
    // The AI might return null or an empty object.
    return [];
  } catch (error) {
    console.error('Error suggesting super-parameters:', error);
    throw new Error('AI로부터 제안을 받아오지 못했습니다. 다시 시도해주세요.');
  }
}
