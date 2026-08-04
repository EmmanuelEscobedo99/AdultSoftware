import { AppProviders } from './providers/AppProviders'
import { AppRouter } from '../routes'

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
