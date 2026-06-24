import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '../api'
import type { NewAccount } from '@kasaio/shared'

const ACCOUNTS_KEY = ['accounts'] as const

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => {
      const result = await accountsApi.getAll()
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NewAccount) => accountsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => accountsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}
