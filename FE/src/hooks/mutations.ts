import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addAdminVillaMedia,
  bulkDeleteAdminVillas,
  bulkStatusUpdateAdminVillas,
  cancelAdminBooking,
  changeAdminPassword,
  checkBooking,
  completeAdminBooking,
  confirmAdminBooking,
  createAdminBlockedDate,
  createAdminVilla,
  createBooking,
  deleteAdminBlockedDate,
  deleteAdminVilla,
  deleteAdminVillaMedia,
  reorderAdminVillaMedia,
  submitFeedback,
  toggleAdminFeedback,
  updateAdminSettings,
  updateAdminVilla,
  updateAdminVillaMedia,
  uploadAdminMedia,
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { AdminBlockedDatePayload, AdminVillaMutationPayload } from '../types';
import type { AdminSettingsResponse, UploadedMedia } from '../lib/api';

function useInvalidateVillaData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'villas'] });
    void queryClient.invalidateQueries({ queryKey: ['villas'] });
    void queryClient.invalidateQueries({ queryKey: ['villa'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
  };
}

function useInvalidateAdminBookings() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'blockedDates'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    void queryClient.invalidateQueries({ queryKey: ['villas'] });
    void queryClient.invalidateQueries({ queryKey: ['villa'] });
  };
}

export function useLookupBookingMutation() {
  return useMutation({
    mutationFn: ({ bookingCode, phone }: { bookingCode: string; phone: string }) => checkBooking(bookingCode, phone),
  });
}

export function useCreateBookingMutation() {
  const invalidateAdminBookings = useInvalidateAdminBookings();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: invalidateAdminBookings,
  });
}

export function useSubmitFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['villa'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });
}

export function useCreateAdminVillaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: createAdminVilla,
    onSuccess: invalidateVillaData,
  });
}

export function useUpdateAdminVillaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminVillaMutationPayload }) => updateAdminVilla(id, data),
    onSuccess: invalidateVillaData,
  });
}

export function useDeleteAdminVillaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: deleteAdminVilla,
    onSuccess: invalidateVillaData,
  });
}

export function useBulkDeleteAdminVillasMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: bulkDeleteAdminVillas,
    onSuccess: invalidateVillaData,
  });
}

export function useBulkStatusUpdateAdminVillasMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) => bulkStatusUpdateAdminVillas(ids, active),
    onSuccess: invalidateVillaData,
  });
}

export function useConfirmAdminBookingMutation() {
  const invalidateAdminBookings = useInvalidateAdminBookings();
  return useMutation({ mutationFn: confirmAdminBooking, onSuccess: invalidateAdminBookings });
}

export function useCancelAdminBookingMutation() {
  const invalidateAdminBookings = useInvalidateAdminBookings();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelAdminBooking(id, reason),
    onSuccess: invalidateAdminBookings,
  });
}

export function useCompleteAdminBookingMutation() {
  const invalidateAdminBookings = useInvalidateAdminBookings();
  return useMutation({ mutationFn: completeAdminBooking, onSuccess: invalidateAdminBookings });
}

export function useToggleAdminFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleAdminFeedback,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
      void queryClient.invalidateQueries({ queryKey: ['villa'] });
      void queryClient.invalidateQueries({ queryKey: ['villas'] });
    },
  });
}

export function useCreateAdminBlockedDateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminBlockedDatePayload) => createAdminBlockedDate(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blockedDates'] });
      void queryClient.invalidateQueries({ queryKey: ['villa'] });
      void queryClient.invalidateQueries({ queryKey: ['villas'] });
    },
  });
}

export function useDeleteAdminBlockedDateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminBlockedDate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blockedDates'] });
      void queryClient.invalidateQueries({ queryKey: ['villa'] });
      void queryClient.invalidateQueries({ queryKey: ['villas'] });
    },
  });
}

export function useUpdateAdminSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminSettingsResponse>) => updateAdminSettings(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicSettings });
    },
  });
}

export function useChangeAdminPasswordMutation() {
  return useMutation({ mutationFn: changeAdminPassword });
}

export function useUploadAdminMediaMutation() {
  return useMutation({ mutationFn: uploadAdminMedia });
}

export function useAddAdminVillaMediaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: ({ villaId, files }: { villaId: string; files: UploadedMedia[] }) => addAdminVillaMedia(villaId, files),
    onSuccess: invalidateVillaData,
  });
}

export function useUpdateAdminVillaMediaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: ({ villaId, mediaId, isCover }: { villaId: string; mediaId: string; isCover: boolean }) =>
      updateAdminVillaMedia(villaId, mediaId, { isCover }),
    onSuccess: invalidateVillaData,
  });
}

export function useDeleteAdminVillaMediaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: ({ villaId, mediaId }: { villaId: string; mediaId: string }) => deleteAdminVillaMedia(villaId, mediaId),
    onSuccess: invalidateVillaData,
  });
}

export function useReorderAdminVillaMediaMutation() {
  const invalidateVillaData = useInvalidateVillaData();
  return useMutation({
    mutationFn: ({ villaId, items }: { villaId: string; items: Array<{ id: string; sortOrder: number }> }) =>
      reorderAdminVillaMedia(villaId, items),
    onSuccess: invalidateVillaData,
  });
}
