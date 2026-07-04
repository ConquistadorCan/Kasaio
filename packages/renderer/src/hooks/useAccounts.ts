import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '../api'
import { unwrapResult } from '../lib/result'
import type { NewAccount } from '@kasaio/shared'

const ACCOUNTS_KEY = ['accounts'] as const

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => unwrapResult(await accountsApi.getAll()),
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: NewAccount) => unwrapResult(await accountsApi.create(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => unwrapResult(await accountsApi.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}
