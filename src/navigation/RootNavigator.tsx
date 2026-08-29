import React, { useState } from 'react';
import { View } from 'react-native';
import { useBike } from '../store/bikeStore';
import { colors } from '../ui/tokens';
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
 * Subscribes to useBike and picks the screen purely from store state, exactly
 * matching the plan's "screen selection follows useBike.session/summary/conn".
 *
 * Routing priority:
 *   1. summary != null       → SummaryScreen   (full screen, no tab bar)
 *   2. session != null       → LiveRideScreen  (full screen, no tab bar — "hidden during a ride")
 *   3. conn === 'connected'  → tab view (Home/Rides/Programs/Profile + custom TabBar)
 *   4. else                  → ConnectScreen   (full screen, no tab bar)
 *
 * Because routing is store-driven, the screen callbacks are effectively no-ops:
 * each transition is caused by the store action the screen already calls
 * (startRide sets session → LiveRide; endRide sets summary → Summary;
 * clearSummary clears summary → tabs; connect sets conn='connected' → tabs).
 * We only reset activeTab to 'home' so a fresh tab session starts on Home.
 */
export function RootNavigator() {
  const conn = useBike(s => s.conn);
  const session = useBike(s => s.session);
  const summary = useBike(s => s.summary);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // 1. Post-ride summary — full screen. DONE clears summary (store) → back to tabs.
  if (summary != null) {
    return <SummaryScreen onDone={() => setActiveTab('home')} />;
  }

  // 2. Active ride — full screen, tab bar hidden. END sets summary (store) → Summary.
  if (session != null) {
    return <LiveRideScreen onEnd={() => {}} />;
  }

  // 3. Connected — the tab view with the custom TabBar.
  if (conn === 'connected') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1 }}>
          {activeTab === 'home' && <HomeScreen onStartRide={() => {}} />}
          {activeTab === 'rides' && <RidesScreen />}
          {activeTab === 'programs' && <ProgramsScreen onStartRide={() => {}} />}
          {activeTab === 'profile' && <ProfileScreen />}
        </View>
        <TabBar active={activeTab} onSelect={setActiveTab} />
      </View>
    );
  }

  // 4. Not connected — full-screen Connect. onConnected sets conn (store) → tabs.
  return (
    <ConnectScreen source={useBike.getState().source} onConnected={() => setActiveTab('home')} />
  );
}
