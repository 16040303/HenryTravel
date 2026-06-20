import { useQuery } from '@tanstack/react-query';
import {
  getAdminBlockedDates,
  getAdminBookings,
  getAdminFeedbacks,
  getAdminLogs,
  getAdminSettings,
  getAdminStats,
  getAdminVillaMedia,
  getAdminVillas,
  getPublicSettings,
  getVillaAvailability,
  getVillaById,
  getVillaFeedbacks,
  getVillas,
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { FilterParams, SearchParams } from '../types';

export function usePublicSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.publicSettings,
    queryFn: getPublicSettings,
  });
}

export function useFeaturedVillasQuery(language: string) {
  return useQuery({
    queryKey: queryKeys.featuredVillas(language),
    queryFn: () => getVillas({ lang: language }),
    select: (villas) => villas.slice(0, 6),
  });
}

export function useVillasQuery(filters: Partial<SearchParams & FilterParams & { isFeatured?: boolean; page?: number; limit?: number; lang?: string }>) {
  return useQuery({
    queryKey: queryKeys.villas(filters),
    queryFn: () => getVillas(filters),
  });
}

export function useVillaDetailQuery(id: string, language: string) {
  return useQuery({
    queryKey: queryKeys.villaDetail(id, language),
    queryFn: () => getVillaById(id, language),
    enabled: Boolean(id),
  });
}

export function useVillaAvailabilityQuery(id: string, month: string) {
  return useQuery({
    queryKey: queryKeys.villaAvailability(id, month),
    queryFn: () => getVillaAvailability(id, month),
    enabled: Boolean(id && month),
  });
}

export function useVillaFeedbacksQuery(id: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.villaFeedbacks(id, page, limit),
    queryFn: () => getVillaFeedbacks(id, page, limit),
    enabled: Boolean(id),
  });
}

export function useAdminStatsQuery(enabled: boolean, polling = false) {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: getAdminStats,
    enabled,
    refetchOnWindowFocus: enabled,
    refetchInterval: polling ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useAdminVillasQuery(params: Record<string, unknown>, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.villas(params),
    queryFn: () => getAdminVillas(params),
    enabled,
  });
}

export function useAdminBookingsQuery(params: Record<string, unknown>, enabled: boolean, polling = false) {
  return useQuery({
    queryKey: queryKeys.admin.bookings(params),
    queryFn: () => getAdminBookings(params),
    enabled,
    refetchOnWindowFocus: enabled,
    refetchInterval: polling ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useAdminFeedbacksQuery(params: Record<string, unknown>, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.feedbacks(params),
    queryFn: () => getAdminFeedbacks(params),
    enabled,
  });
}

export function useAdminLogsQuery(params: Record<string, unknown>, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.logs(params),
    queryFn: () => getAdminLogs(params),
    enabled,
  });
}

export function useAdminSettingsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: getAdminSettings,
    enabled,
  });
}

export function useAdminBlockedDatesQuery(params: Record<string, unknown>, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.blockedDates(params),
    queryFn: () => getAdminBlockedDates(params),
    enabled,
    refetchOnWindowFocus: enabled,
  });
}

export function useAdminVillaMediaQuery(villaId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.villaMedia(villaId),
    queryFn: () => getAdminVillaMedia(villaId),
    enabled: enabled && Boolean(villaId),
  });
}
