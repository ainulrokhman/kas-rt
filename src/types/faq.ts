export type FaqCategory = 'umum' | 'pengurus' | 'penarik_jimpitan';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  order: number;
  is_active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FaqInput {
  question: string;
  answer: string;
  category: FaqCategory;
  order?: number;
  is_active?: boolean;
}
