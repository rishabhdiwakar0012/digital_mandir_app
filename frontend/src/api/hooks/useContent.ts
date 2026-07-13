import { useQuery } from '@tanstack/react-query';
import { contentApi, ApiDeity, ApiMantra, ApiFestival } from '../services/contentApi';

export function useDeities() {
  return useQuery<ApiDeity[]>({
    queryKey: ['deities'],
    queryFn: contentApi.getDeities,
  });
}

export function useMantras(params?: {
  category?: string;
  deityId?: string;
  festivalId?: string;
}) {
  return useQuery<ApiMantra[]>({
    queryKey: ['mantras', params?.category, params?.deityId, params?.festivalId],
    queryFn: () => contentApi.getMantras(params),
    enabled: !!(params?.category || params?.deityId || params?.festivalId),
    // Always re-fetch when MantraSelectionScreen mounts — this is the critical point
    // where audio URLs are picked, so we must never serve stale cached data.
    staleTime: 0,
  });
}

export function useFestivals() {
  return useQuery<ApiFestival[]>({
    queryKey: ['festivals'],
    queryFn: contentApi.getFestivals,
  });
}
