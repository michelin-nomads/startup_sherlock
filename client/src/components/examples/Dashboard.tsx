import { Dashboard } from '../dashboard'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

export default function DashboardExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4">
        <Dashboard />
      </div>
    </QueryClientProvider>
  )
}