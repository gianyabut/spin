import React, { useState } from 'react';
import { View } from 'react-native';
import { useBike } from '../store/bikeStore';
import { useSettings } from '../store/settingsStore';
import { colors } from '../ui/tokens';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RidesScreen } from '../screens/RidesScreen';
import { ProgramsScreen } from '../screens/ProgramsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ConnectScreen } from '../screens/ConnectScreen';
import { LiveRideScreen } from '../screens/LiveRideScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { TabBar, TabKey } from './TabBar';

/**
 * Store-state-driven root (plan ruling R9) — NOT React Navigation.
 * Subscribes to useBike and picks the screen from store state, plus one piece of
 * local UI state (showConnect) for the on-demand Find-Your-Bike overlay.
 *
 * Routing priority:
 *   1. summary != null   → SummaryScreen   (full screen, no tab bar)
 *   2. session != null   → LiveRideScreen  (full screen, no tab bar — "hidden during a ride")
 *   3. showConnect       → ConnectScreen   (full screen, reached on demand, dismissable)
 *   4. else              → tab view (Home/Rides/Programs/Profile + custom TabBar)
 *
 * The tab view is ALWAYS reachable — connected or not — so history, programs and
 * profile can be browsed without a bike. Connect is no longer a launch gate: it is
 * opened on demand (via onRequestConnect from Home/Programs) and dismissed via its
 * BACK control. A successful connect flips conn='connected' in the store; the ride
 * affordances then start rides instead of re-opening Connect.
 *
 * Store-driven transitions still hold: startRide sets session → LiveRide; endRide
 * sets summary → Summary; clearSummary clears summary → tabs.
 */
export function RootNavigator() {
  const session = useBike(s => s.session);
  const summary = useBike(s => s.summary);
  const name = useSettings(s => s.name);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showConnect, setShowConnect] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  // 1. Post-ride summary — full screen. DONE clears summary (store) → back to tabs.
  if (summary != null) {
    return <SummaryScreen onDone={() => setActiveTab('home')} />;
  }

  // 2. Active ride — full screen, tab bar hidden. END sets summary (store) → Summary.
  if (session != null) {
    return <LiveRideScreen onEnd={() => {}} />;
  }

  // 2.5 First-run onboarding — shown once while no name is saved. Entering a name
  //     sets name (store) so it won't reappear; SKIP sets onboarded locally.
  if (name === '' && !onboarded) {
    return <WelcomeScreen onDone={() => setOnboarded(true)} />;
  }

  // 3. On-demand Connect — full screen, dismissable. onConnected flips conn (store)
  //    and closes the overlay; BACK just closes it (stay disconnected, keep browsing).
  if (showConnect) {
    return (
      <ConnectScreen
        source={useBike.getState().source}
        onConnected={() => setShowConnect(false)}
        onClose={() => setShowConnect(false)}
      />
    );
  }

  // 4. The tab view — always reachable, connected or not.
  const openConnect = () => setShowConnect(true);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && <HomeScreen onStartRide={() => {}} onRequestConnect={openConnect} />}
        {activeTab === 'rides' && <RidesScreen />}
        {activeTab === 'programs' && <ProgramsScreen onStartRide={() => {}} onRequestConnect={openConnect} />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>
      <TabBar active={activeTab} onSelect={setActiveTab} />
    </View>
  );
}
