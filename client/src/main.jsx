import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/newsreader/standard.css'
import '@fontsource-variable/newsreader/standard-italic.css'
import '@fontsource-variable/roboto-flex/standard.css'
// Kurdish (Arabic script) is set in Zain; only its Arabic letters are loaded, Latin stays Newsreader / Roboto Flex
import '@fontsource/zain/arabic-300.css'
import '@fontsource/zain/arabic-400.css'
import '@fontsource/zain/arabic-700.css'
import '@fontsource/zain/arabic-800.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/components.css'
import './styles/home.css'
import './styles/map.css'
import './styles/train.css'
import './styles/mirror.css'
import './styles/patterns.css'
import './styles/how.css'
import App from './App'
import { LangProvider } from './i18n'
import { routerBase } from './lib/asset'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <BrowserRouter basename={routerBase}>
        <App />
      </BrowserRouter>
    </LangProvider>
  </React.StrictMode>,
)
