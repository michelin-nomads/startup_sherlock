import { ThemeToggle } from '../theme-toggle'
import { ThemeProvider } from '../theme-provider'

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Theme Toggle</h3>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}