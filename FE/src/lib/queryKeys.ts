export const queryKeys = {
  publicSettings: ['publicSettings'] as const,
  villas: (filters: Record<string, unknown>) => ['villas', filters] as const,
  featuredVillas: (language: string) => ['villas', 'featured', { language }] as const,
  villaDetail: (id: string, language: string) => ['villa', id, { language }] as const,
  villaAvailability: (id: string, month: string) => ['villa', id, 'availability', { month }] as const,
  villaFeedbacks: (id: string, page: number, limit: number) => ['villa', id, 'feedbacks', { page, limit }] as const,
  bookingLookup: (code: string, phone: string) => ['bookingLookup', { code, phone }] as const,
  admin: {
    stats: ['admin', 'stats'] as const,
    villas: (params: Record<string, unknown>) => ['admin', 'villas', params] as const,
    bookings: (params: Record<string, unknown>) => ['admin', 'bookings', params] as const,
    feedbacks: (params: Record<string, unknown>) => ['admin', 'feedbacks', params] as const,
    logs: (params: Record<string, unknown>) => ['admin', 'logs', params] as const,
    settings: ['admin', 'settings'] as const,
    blockedDates: (params: Record<string, unknown>) => ['admin', 'blockedDates', params] as const,
    villaMedia: (villaId: string) => ['admin', 'villaMedia', villaId] as const,
  },
};
