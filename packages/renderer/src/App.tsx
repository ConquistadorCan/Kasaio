import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'accounts', element: <Accounts /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'categories', element: <Categories /> },
    ],
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster richColors closeButton />
    </ErrorBoundary>
  )
}
