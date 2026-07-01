import { useState } from 'react'
import { AccountTypeEnum, CurrencyEnum, type AccountType, type Currency } from '@kasaio/shared'
import { useAccounts, useCreateAccount } from '../hooks/useAccounts'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type AccountFormProps = {
  open: boolean
  onOpenChange?: (open: boolean) => void
  forced?: boolean
}

export default function AccountForm({ open, onOpenChange, forced = false }: AccountFormProps) {
  const { data: accounts } = useAccounts()
  const createAccount = useCreateAccount()

  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('cash')
  const [currency, setCurrency] = useState<Currency>('TRY')
  const [linkedCashAccountId, setLinkedCashAccountId] = useState<string>('')

  const cashAccounts = (accounts ?? []).filter((a) => a.account_type === 'cash')

  const canSubmit = name.trim().length > 0 && !createAccount.isPending

  function reset() {
    setName('')
    setAccountType('cash')
    setCurrency('TRY')
    setLinkedCashAccountId('')
  }

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

    reset()
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={forced ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!forced}
        onEscapeKeyDown={forced ? (e) => e.preventDefault() : undefined}
        onInteractOutside={forced ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>{forced ? 'Create your first account' : 'New account'}</DialogTitle>
          <DialogDescription>
            {forced
              ? 'You need at least one account before you can start tracking transactions.'
              : 'Add a new cash or investment account.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            <Select
              value={accountType}
              onValueChange={(value) => setAccountType(value as AccountType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AccountTypeEnum.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'cash' ? 'Cash' : 'Investment'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Currency</Label>
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value as Currency)}
            >
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
            <div className="flex flex-col gap-1.5">
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

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {createAccount.isPending ? 'Creating...' : 'Create account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
