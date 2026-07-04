import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import AccountForm from './AccountForm'
import { useAccounts } from '../hooks/useAccounts'
import { getErrorMessage } from '../lib/errorMessages'

export default function Layout() {
  const { data: accounts, isLoading, isError, error } = useAccounts()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-destructive">
        Failed to load accounts: {getErrorMessage(error)}
      </div>
    )
  }

  if (!accounts || accounts.length === 0) {
    return <AccountForm open forced />
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
