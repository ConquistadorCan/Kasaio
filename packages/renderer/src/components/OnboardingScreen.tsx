import { useState } from 'react'
import { AccountTypeEnum, CurrencyEnum, type AccountType, type Currency } from '@kasaio/shared'
import { useAccounts, useCreateAccount } from '../hooks/useAccounts'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const ACCOUNT_TYPE_COPY: Record<AccountType, { label: string; description: string; icon: string }> = {
  cash: {
    label: 'Cash',
    description: 'Wallet, bank account, or anything you spend day to day.',
    icon: '💵',
  },
  investment: {
    label: 'Investment',
    description: 'Brokerage, savings, or anything that grows over time.',
    icon: '📈',
  },
}

export default function OnboardingScreen() {
  const { data: accounts } = useAccounts()
  const createAccount = useCreateAccount()

  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('cash')
  const [currency, setCurrency] = useState<Currency>('TRY')
  const [linkedCashAccountId, setLinkedCashAccountId] = useState<string>('')

  const cashAccounts = (accounts ?? []).filter((a) => a.account_type === 'cash')

  const canSubmit = name.trim().length > 0 && !createAccount.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    await createAccount.mutateAsync({
      name: name.trim(),
      account_type: accountType,
      currency,
      linked_cash_account_id:
        accountType === 'investment' && linkedCashAccountId
          ? Number(linkedCashAccountId)
          : null,
    })
  }

  return (
    <div
      className="flex h-screen items-center justify-center bg-background p-6"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 15%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 55%), radial-gradient(circle at 85% 85%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 50%)',
      }}
    >
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome to Kasaio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let&apos;s set up your first account to start tracking your money.
          </p>
        </div>

        <form
          className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              placeholder="e.g. Wallet, Brokerage"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {AccountTypeEnum.options.map((type) => {
                const copy = ACCOUNT_TYPE_COPY[type]
                const selected = accountType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    <span className="text-xl">{copy.icon}</span>
                    <span className="text-sm font-medium text-foreground">{copy.label}</span>
                    <span className="text-xs text-muted-foreground">{copy.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CurrencyEnum.options.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {accountType === 'investment' && cashAccounts.length > 0 && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
              <Label>Linked cash account</Label>
              <Select value={linkedCashAccountId} onValueChange={setLinkedCashAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {cashAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {createAccount.isPending ? 'Creating...' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
