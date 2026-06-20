import { vi } from './vi';
import { en } from './en';
import { ko } from './ko';
import { zh } from './zh';
import { Language, TranslationMap } from './types';

export * from './types';
export * from './vi';
export * from './en';
export * from './ko';
export * from './zh';

export const TRANSLATIONS: Record<Language, TranslationMap> = {
  vi,
  en,
  ko,
  zh,
};
