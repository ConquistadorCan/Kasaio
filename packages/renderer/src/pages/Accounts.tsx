import { useState } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { getErrorMessage } from '../lib/errorMessages'
import AccountCard from '../components/AccountCard'
import AccountForm from '../components/AccountForm'
import { Button } from '../components/ui/button'

export default function Accounts() {
  const { data: accounts, isLoading, isError, error } = useAccounts()
  const [formOpen, setFormOpen] = useState(false)

  const cashAccounts = (accounts ?? []).filter((a) => a.account_type === 'cash')
  const investmentAccounts = (accounts ?? []).filter((a) => a.account_type === 'investment')

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Accounts</h1>
        <Button onClick={() => setFormOpen(true)}>Add account</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {isError && (
        <p className="text-sm text-destructive">Failed to load accounts: {getErrorMessage(error)}</p>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Cash</h2>
            {cashAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cash accounts yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cashAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Investment</h2>
            {investmentAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No investment accounts yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {investmentAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <AccountForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
