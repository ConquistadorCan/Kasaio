import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
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
