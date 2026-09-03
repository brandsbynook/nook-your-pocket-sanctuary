import { useState, useEffect } from 'react'
import HomeScreen        from './screens/HomeScreen'
import BrainDumpScreen   from './screens/BrainDumpScreen'
import Reflect           from './screens/Reflect'
import CardsScreen       from './screens/CardsScreen'
import SettingsScreen    from './screens/SettingsScreen'
import MemoryChestScreen from './screens/MemoryChestScreen'
import CompanionScreen   from './screens/CompanionScreen'
import TuneDownScreen    from './screens/TuneDownScreen'
import SoundscapesScreen from './screens/SoundscapesScreen'
import OnboardingScreen  from './screens/OnboardingScreen'
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen'

import { AudioProvider } from './context/AudioContext'
import QuickAudioSheet from './components/QuickAudioSheet'
import SanctuaryKeyModal from './components/SanctuaryKeyModal'

export type Screen =
  | 'onboarding'
  | 'home'
  | 'brain-dump'
  | 'reflect'
  | 'companion'
  | 'tune-down'
  | 'soundscapes'
  | 'cards'
  | 'settings'
  | 'memory-chest'
  | 'privacy'

function getInitialScreen(): Screen {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '')
    const hash = window.location.hash.toLowerCase()
    if (path === '/privacy' || hash === '#privacy') {
      return 'privacy'
    }
  }
  return 'home'
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [previousScreen, setPreviousScreen] = useState<Screen>('home')

  useEffect(() => {
    function handleLocation() {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '')
      const hash = window.location.hash.toLowerCase()
      if (path === '/privacy' || hash === '#privacy') {
        setScreen('privacy')
      } else {
        setScreen((prev) => (prev === 'privacy' ? 'home' : prev))
      }
    }

    window.addEventListener('popstate', handleLocation)
    window.addEventListener('hashchange', handleLocation)
    return () => {
      window.removeEventListener('popstate', handleLocation)
      window.removeEventListener('hashchange', handleLocation)
    }
  }, [])

  const navigateTo = (target: Screen | string) => {
    if (target === 'privacy') {
      setPreviousScreen(screen === 'privacy' ? 'home' : screen)
      if (window.location.pathname !== '/privacy') {
        try {
          window.history.pushState(null, '', '/privacy')
        } catch {
          window.location.hash = '#privacy'
        }
      }
      setScreen('privacy')
    } else {
      if (window.location.pathname === '/privacy' || window.location.hash === '#privacy') {
        try {
          window.history.pushState(null, '', '/')
        } catch {
          window.location.hash = ''
        }
      }
      setScreen(target as Screen)
    }
  }

  return (
    <AudioProvider>
      <div className="w-full h-[100dvh] bg-[#0A0A0B] flex justify-center overflow-hidden">
        <main className="w-full max-w-md h-full flex flex-col relative overflow-hidden bg-[#0A0A0B]">
          {screen === 'onboarding' && (
            <OnboardingScreen onComplete={() => navigateTo('home')} />
          )}
          {screen === 'home' && (
            <HomeScreen onNavigate={navigateTo} />
          )}
          {screen === 'brain-dump' && (
            <BrainDumpScreen onBack={() => navigateTo('home')} />
          )}
          {screen === 'reflect' && (
            <Reflect onBack={() => navigateTo('home')} />
          )}
          {screen === 'companion' && (
            <CompanionScreen onBack={() => navigateTo('home')} />
          )}
          {screen === 'tune-down' && (
            <TuneDownScreen onBack={() => navigateTo('home')} />
          )}
          {screen === 'soundscapes' && (
            <SoundscapesScreen onBack={() => navigateTo('home')} />
          )}
          {screen === 'cards' && (
            <CardsScreen
              onBack={() => navigateTo('home')}
              onNavigate={tab => navigateTo(tab as Screen)}
            />
          )}
          {screen === 'memory-chest' && (
            <MemoryChestScreen
              onBack={() => navigateTo('home')}
              onNavigate={tab => navigateTo(tab as Screen)}
            />
          )}
          {screen === 'settings' && (
            <SettingsScreen
              onBack={() => navigateTo('home')}
              onNavigate={tab => navigateTo(tab as Screen)}
            />
          )}
          {screen === 'privacy' && (
            <PrivacyPolicyScreen
              onBack={() => {
                if (window.location.pathname === '/privacy' || window.location.hash === '#privacy') {
                  try {
                    window.history.pushState(null, '', '/')
                  } catch {
                    window.location.hash = ''
                  }
                }
                setScreen(previousScreen === 'privacy' ? 'home' : previousScreen)
              }}
            />
          )}
        </main>

        {/* Global Quick Audio Sheet (Mini-Player) */}
        <QuickAudioSheet
          onNavigateSoundSanctuary={() => navigateTo('soundscapes')}
        />

        {/* Sanctuary Key Ethical Paywall Modal */}
        <SanctuaryKeyModal />
      </div>
    </AudioProvider>
  )
}

export default App
