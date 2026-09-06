import { useState, useEffect } from 'react'
import HomeScreen from './screens/HomeScreen'
import BrainDumpScreen from './screens/BrainDumpScreen'
import Reflect from './screens/Reflect'
import CardsScreen from './screens/CardsScreen'
import SettingsScreen from './screens/SettingsScreen'
import MemoryChestScreen from './screens/MemoryChestScreen'
import CompanionScreen from './screens/CompanionScreen'
import TuneDownScreen from './screens/TuneDownScreen'
import SoundscapesScreen from './screens/SoundscapesScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen'
import BannerScreen from './screens/BannerScreen'

import { AudioProvider } from './context/AudioContext'
import QuickAudioSheet from './components/QuickAudioSheet'
import SanctuaryKeyModal from './components/SanctuaryKeyModal'
import { PATRON_STORAGE_KEY } from './services/revenuecat'

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
  | 'banner'

function getInitialScreen(): Screen {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '')
    const hash = window.location.hash.toLowerCase()
    if (path === '/privacy' || hash === '#privacy') {
      return 'privacy'
    }
    if (path === '/banner' || hash === '#banner') {
      return 'banner'
    }
  }
  return 'home'
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)

  // Check URL query parameters for Judge Bypass: ?passcode=SHIPATHON2026 or ?judge=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('passcode') || params.get('code')
      const isJudge = params.get('judge') === 'true'

      if (isJudge || (code && code.toUpperCase() === 'SHIPATHON2026')) {
        localStorage.setItem(PATRON_STORAGE_KEY, 'true')
        console.info('[Nook] Judge bypass activated via link.')
      }
    }
  }, [])

  // Universal Hardware / Swipe Back Navigation Listener
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      const targetScreen = (e.state?.screen as Screen) || 'home'
      setScreen(targetScreen)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (target: Screen | string) => {
    const nextScreen = target as Screen

    if (nextScreen === screen) return

    // Push entry to browser history so phone back button returns to previous screen
    if (typeof window !== 'undefined') {
      if (nextScreen === 'home') {
        window.history.pushState({ screen: 'home' }, '', '/')
      } else if (nextScreen === 'privacy') {
        window.history.pushState({ screen: 'privacy' }, '', '/privacy')
      } else if (nextScreen === 'banner') {
        window.history.pushState({ screen: 'banner' }, '', '/banner')
      } else {
        window.history.pushState({ screen: nextScreen }, '', `/#${nextScreen}`)
      }
    }

    setScreen(nextScreen)
  }

  const handleReturnToHome = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigateTo('home')
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
            <BrainDumpScreen onBack={handleReturnToHome} />
          )}
          {screen === 'reflect' && (
            <Reflect onBack={handleReturnToHome} />
          )}
          {screen === 'companion' && (
            <CompanionScreen onBack={handleReturnToHome} />
          )}
          {screen === 'tune-down' && (
            <TuneDownScreen onBack={handleReturnToHome} />
          )}
          {screen === 'soundscapes' && (
            <SoundscapesScreen onBack={handleReturnToHome} />
          )}
          {screen === 'cards' && (
            <CardsScreen
              onBack={handleReturnToHome}
              onNavigate={tab => navigateTo(tab as Screen)}
            />
          )}
          {screen === 'memory-chest' && (
            <MemoryChestScreen
              onBack={handleReturnToHome}
              onNavigate={tab => navigateTo(tab as Screen)}
            />
          )}
          {screen === 'settings' && (
            <SettingsScreen
              onBack={handleReturnToHome}
              onNavigate={tab => navigateTo(tab as Screen)}
            />
          )}
          {screen === 'privacy' && (
            <PrivacyPolicyScreen
              onBack={handleReturnToHome}
            />
          )}
          {screen === 'banner' && (
            <BannerScreen
              onBack={handleReturnToHome}
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