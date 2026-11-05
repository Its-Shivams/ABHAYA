import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Report, PaginatedResponse } from '../types';

export function useReports(params: {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Report>>('/admin/reports', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useVerifyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => api.patch(`/admin/reports/${reportId}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useRejectReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, reason }: { reportId: string; reason: string }) =>
      api.patch(`/admin/reports/${reportId}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useMarkUnderVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) =>
      api.patch(`/admin/reports/${reportId}/under-verification`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
