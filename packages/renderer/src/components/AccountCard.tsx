import type { Account } from '@kasaio/shared'

export default function AccountCard({ account }: { account: Account }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-foreground">{account.name}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {account.currency}
        </span>
      </div>
      <span className="text-lg font-semibold tabular-nums text-muted-foreground">—</span>
    </div>
  )
}
