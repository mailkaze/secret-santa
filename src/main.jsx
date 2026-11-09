import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import './index.css'
import App from './App'
import AppProviders from './components/AppProviders'
import store from './redux/store'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders store={store}>
      <App />
    </AppProviders>
  </StrictMode>
)
