import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { User, PaginatedResponse } from '../types';

export function useUsers(params: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/admin/users', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await api.get<User>(`/admin/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
