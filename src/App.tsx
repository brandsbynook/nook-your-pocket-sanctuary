import { useState } from 'react'
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
import { isOnboarded }   from './utils/storage'

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

function App() {
  const [screen, setScreen] = useState<Screen>(() => (isOnboarded() ? 'home' : 'onboarding'))

  return (
    <AudioProvider>
      {screen === 'onboarding' && (
        <OnboardingScreen onComplete={() => setScreen('home')} />
      )}
      {screen === 'home' && (
        <HomeScreen onNavigate={setScreen} />
      )}
      {screen === 'brain-dump' && (
        <BrainDumpScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'reflect' && (
        <Reflect onBack={() => setScreen('home')} />
      )}
      {screen === 'companion' && (
        <CompanionScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'tune-down' && (
        <TuneDownScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'soundscapes' && (
        <SoundscapesScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'cards' && (
        <CardsScreen
          onBack={() => setScreen('home')}
          onNavigate={tab => setScreen(tab as Screen)}
        />
      )}
      {screen === 'memory-chest' && (
        <MemoryChestScreen
          onBack={() => setScreen('home')}
          onNavigate={tab => setScreen(tab as Screen)}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen('home')}
          onNavigate={tab => setScreen(tab as Screen)}
          onReplayOnboarding={() => setScreen('onboarding')}
        />
      )}

      {/* Global Quick Audio Sheet (Mini-Player) */}
      <QuickAudioSheet
        onNavigateSoundSanctuary={() => setScreen('soundscapes')}
      />

      {/* Sanctuary Key Ethical Paywall Modal */}
      <SanctuaryKeyModal />
    </AudioProvider>
  )
}

export default App
