import { useState, useEffect } from 'react'
import { App as CapApp } from '@capacitor/app'
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
import { PATRON_STORAGE_KEY, initPurchases } from './services/revenuecat'

// Synchronous judge bypass check: runs immediately before React renders any screen
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('passcode') || params.get('code')
    const isJudge = params.get('judge') === 'true'

    if (isJudge || (code && (code.toUpperCase() === 'SHIPATON2026' || code.toUpperCase() === 'SHIPATHON2026'))) {
      localStorage.setItem(PATRON_STORAGE_KEY, 'true')
      window.dispatchEvent(new Event('storage'))
      console.info('[Nook] Synchronous Judge bypass activated.')
    }
  } catch (err) {
    console.error('[Nook] Bypass check error:', err)
  }
}

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
    if (hash === '#soundscapes') {
      return 'soundscapes'
    }
  }
  return 'home'
}

function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)

  // Initialize Purchases and check URL query parameters for Judge Bypass: ?passcode=SHIPATHON2026 or ?judge=true
  // Double-check inside useEffect to ensure any active contexts or listeners re-sync
  useEffect(() => {
    initPurchases()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('passcode') || params.get('code')
      const isJudge = params.get('judge') === 'true'

      if (isJudge || (code && (code.toUpperCase() === 'SHIPATON2026' || code.toUpperCase() === 'SHIPATHON2026'))) {
        localStorage.setItem(PATRON_STORAGE_KEY, 'true')
        window.dispatchEvent(new Event('storage'))
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

  const BOTTOM_PANEL_TABS: Screen[] = ['settings', 'memory-chest', 'cards']

  const navigateTo = (target: Screen | string) => {
    const nextScreen = target as Screen
    if (nextScreen === screen) return

    if (typeof window !== 'undefined') {
      const isBottomPanelSwitch =
        BOTTOM_PANEL_TABS.includes(screen) && BOTTOM_PANEL_TABS.includes(nextScreen)

      if (isBottomPanelSwitch) {
        window.history.replaceState({ screen: nextScreen }, '', `/#${nextScreen}`)
      } else if (nextScreen === 'home') {
        window.history.replaceState({ screen: 'home' }, '', '/')
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
    if (typeof window !== 'undefined') {
      window.history.replaceState({ screen: 'home' }, '', '/')
    }
    setScreen('home')
  }

  // Android Native Hardware / Gesture Back Button Listener
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => {
      // 1. Quiet Mode Protection:
      // Tapping back or using the Android back gesture inside Quiet Mode must gently return to 'home'.
      // It must NEVER call CapApp.exitApp() or quit the app.
      const quietOverlay = document.getElementById('quiet-mode-overlay')
      if (quietOverlay) {
        const quietReturnBtn = document.getElementById('quiet-mode-return-btn') as HTMLElement | null
        if (quietReturnBtn) {
          quietReturnBtn.click()
        }
        return
      }

      // 2. Global Overlays & Modals:
      const paywallBackdrop = document.getElementById('sanctuary-key-backdrop') as HTMLElement | null
      if (paywallBackdrop) {
        paywallBackdrop.click()
        return
      }

      const quickAudioBackdrop = document.getElementById('quick-audio-sheet-backdrop') as HTMLElement | null
      if (quickAudioBackdrop) {
        quickAudioBackdrop.click()
        return
      }

      const fullscreenCard = document.getElementById('fullscreen-card') as HTMLElement | null
      if (fullscreenCard) {
        fullscreenCard.click()
        return
      }

      const newCardModal = document.getElementById('new-card-title')
      if (newCardModal) {
        const cancelBtn = newCardModal.closest('.fixed')?.querySelector('button') as HTMLElement | null
        if (cancelBtn) {
          cancelBtn.click()
          return
        }
      }

      // 3. Respect Nested Sub-screens:
      // In Tune Down: If an active practice/stim is open (e.g. Bubble Lattice, Stim Pad),
      // the back button label is "tools". Click it to step back to the section's menu.
      if (screen === 'tune-down') {
        const tuneDownBack = document.getElementById('tune-down-back') as HTMLElement | null
        if (tuneDownBack && tuneDownBack.textContent?.toLowerCase().includes('tools')) {
          tuneDownBack.click()
          return
        }
        handleReturnToHome()
        return
      }

      // In Reflect: If an active prompt is open in library mode,
      // the back button label is "library". Click it to return to the library menu.
      if (screen === 'reflect') {
        const reflectBack = document.getElementById('reflect-back') as HTMLElement | null
        if (reflectBack && reflectBack.textContent?.toLowerCase().includes('library')) {
          reflectBack.click()
          return
        }
        handleReturnToHome()
        return
      }

      // In Companion: Handle modal or exit friction
      if (screen === 'companion') {
        const compModal = document.querySelector('[role="dialog"][aria-labelledby="companion-modal-title"]') as HTMLElement | null
        if (compModal) {
          compModal.click()
          return
        }
        const decelModal = document.querySelector('[role="dialog"][aria-labelledby="deceleration-modal-title"]') as HTMLElement | null
        if (decelModal) {
          decelModal.click()
          return
        }
        const companionBack = document.getElementById('companion-screen-header-back') as HTMLElement | null
        if (companionBack) {
          companionBack.click()
          return
        }
        handleReturnToHome()
        return
      }

      // In Memory Chest: If in list view of notes jar, return to jar
      if (screen === 'memory-chest') {
        const drawFromJarBtn = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.toLowerCase().includes('draw from jar')
        )
        if (drawFromJarBtn) {
          drawFromJarBtn.click()
          return
        }
        handleReturnToHome()
        return
      }

      // 4. Any top-level room or panel screen ('brain-dump', 'settings', 'cards', 'soundscapes', 'privacy', 'banner'):
      // Return directly to 'home'
      if (screen !== 'home') {
        handleReturnToHome()
        return
      }

      // 5. Resting on 'home' with no overlays open: Exit app
      CapApp.exitApp()
    })

    return () => {
      backListener.then(listener => listener.remove())
    }
  }, [screen])

  return (
    <AudioProvider>
      <div
        className="w-full h-[100dvh] bg-[#0A0A0B] flex justify-center overflow-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
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
