import { apiClient } from '../client';

export interface I18nText {
  en: string;
  hi: string;
  sa?: string;
}

export interface ApiDeity {
  _id: string;
  slug: string;
  name: I18nText;
  description?: I18nText;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ApiMantra {
  _id: string;
  category: 'festival' | 'god' | 'special' | 'custom';
  deityId?: ApiDeity | string;
  festivalId?: string;
  title: I18nText;
  text: I18nText;
  description?: I18nText;
  imageUrl?: string;
  audioUrl?: string;
  beadCount: number;
  coinsReward: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ApiFestival {
  _id: string;
  section: string;
  slug?: string;
  title: I18nText;
  body?: I18nText;
  imageUrl?: string;
  iconName?: string;
  isActive: boolean;
  sortOrder: number;
}

export const contentApi = {
  getDeities: (): Promise<ApiDeity[]> => {
    return apiClient.get<ApiDeity[]>('/content/deities');
  },

  getMantras: (params?: {
    category?: string;
    deityId?: string;
    festivalId?: string;
  }): Promise<ApiMantra[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.deityId) searchParams.append('deityId', params.deityId);
    if (params?.festivalId) searchParams.append('festivalId', params.festivalId);
    const qs = searchParams.toString();
    return apiClient.get<ApiMantra[]>(`/content/mantras${qs ? `?${qs}` : ''}`);
  },

  getFestivals: (): Promise<ApiFestival[]> => {
    return apiClient.get<ApiFestival[]>('/content/sections/festival');
  },
};
