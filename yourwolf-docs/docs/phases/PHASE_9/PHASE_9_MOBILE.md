# Phase 9: Mobile App

> **React Native mobile app with offline support**

## Overview

**Goal**: Build a cross-platform mobile app using React Native, sharing ~70% of code with the web frontend.

**Duration**: ~4 weeks

**Prerequisites**: Phase 8 (AWS Deployment) complete

**Deliverables**:
- React Native app (iOS + Android)
- Offline role storage
- Push notifications
- App store deployment

---

## Architecture

```mermaid
flowchart TB
    subgraph Mobile App
        RN[React Native]
        
        subgraph Shared Code
            Hooks[Custom Hooks]
            API[API Client]
            Types[TypeScript Types]
            Utils[Utilities]
        end
        
        subgraph Native
            Nav[Navigation]
            Storage[AsyncStorage]
            Push[Push Notifications]
            Audio[Native Audio]
        end
        
        subgraph UI
            Screens[Screens]
            Components[RN Components]
        end
    end
    
    subgraph Backend
        FastAPI[FastAPI]
        WebSocket[WebSocket]
    end
    
    RN --> Shared Code
    RN --> Native
    RN --> UI
    API --> FastAPI
    Hooks --> WebSocket
```

---

## Project Setup

### React Native Project Structure

```
mobile/
├── package.json
├── tsconfig.json
├── app.json
├── babel.config.js
├── metro.config.js
├── index.js
├── App.tsx
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── RoleBuilderScreen.tsx
│   │   ├── BrowseScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── RoleCard.tsx
│   │   ├── PlayerList.tsx
│   │   ├── Timer.tsx
│   │   ├── VoteButton.tsx
│   │   └── NightPhaseOverlay.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── hooks/
│   │   └── index.ts          # Re-exports from shared
│   ├── services/
│   │   ├── storage.ts
│   │   ├── notifications.ts
│   │   └── audio.ts
│   ├── shared/               # Symlinked from web
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── styles/
│       ├── theme.ts
│       └── common.ts
├── ios/
│   └── YourWolf/
└── android/
    └── app/
```

### package.json

```json
{
  "name": "yourwolf-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:ios": "cd ios && xcodebuild -workspace YourWolf.xcworkspace -scheme YourWolf -configuration Release",
    "build:android": "cd android && ./gradlew assembleRelease"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.2",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-push-notification": "^8.1.1",
    "@react-native-firebase/app": "^18.7.3",
    "@react-native-firebase/messaging": "^18.7.3",
    "amazon-cognito-identity-js": "^6.3.7",
    "react-native-sound": "^0.11.2",
    "react-native-gesture-handler": "^2.14.1",
    "react-native-reanimated": "^3.6.1",
    "zustand": "^4.5.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@babel/core": "^7.23.7",
    "@babel/runtime": "^7.23.7",
    "@types/react": "^18.2.48",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.3"
  }
}
```

---

## Shared Code Strategy

### Shared Module Structure (`shared/`)

```typescript
// shared/types/index.ts
// All TypeScript interfaces - 100% shared

export interface Role {
  id: string;
  name: string;
  description: string;
  team: 'werewolf' | 'villager' | 'neutral';
  abilities: Ability[];
  win_condition: string;
}

export interface Game {
  id: string;
  code: string;
  phase: GamePhase;
  players: Player[];
  roles: Role[];
}

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting' | 'ended';

// ... all other types
```

```typescript
// shared/api/client.ts
// API client - shared with platform-specific fetch

import axios, { AxiosInstance } from 'axios';

export const createApiClient = (
  baseURL: string,
  getToken: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({ baseURL });
  
  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  return client;
};

// shared/api/roles.ts
export const rolesApi = (client: AxiosInstance) => ({
  getAll: () => client.get<Role[]>('/api/roles'),
  getById: (id: string) => client.get<Role>(`/api/roles/${id}`),
  create: (role: CreateRoleRequest) => client.post<Role>('/api/roles', role),
  search: (params: SearchParams) => client.get<SearchResult>('/api/roles/search', { params }),
});

// shared/api/games.ts
export const gamesApi = (client: AxiosInstance) => ({
  create: (req: CreateGameRequest) => client.post<Game>('/api/games', req),
  join: (code: string, name: string) => client.post<JoinResult>(`/api/games/${code}/join`, { name }),
  getState: (gameId: string) => client.get<GameState>(`/api/games/${gameId}/state`),
});
```

```typescript
// shared/hooks/useRoles.ts
// Custom hooks - shared logic

import { useState, useEffect } from 'react';
import { Role } from '../types';

export const useRoles = (api: ReturnType<typeof rolesApi>) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    api.getAll()
      .then(res => setRoles(res.data))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  return { roles, loading, error, refetch: () => {} };
};

// shared/hooks/useGame.ts
export const useGame = (gameId: string, wsUrl: string) => {
  const [game, setGame] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(`${wsUrl}/games/${gameId}/ws`);
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => setGame(JSON.parse(e.data));
    
    return () => ws.close();
  }, [gameId]);
  
  return { game, connected };
};

// shared/utils/validation.ts
export const validateRoleName = (name: string): string | null => {
  if (!name.trim()) return 'Name is required';
  if (name.length < 2) return 'Name too short';
  if (name.length > 50) return 'Name too long';
  return null;
};
```

### Metro Config for Shared Code

```javascript
// metro.config.js
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const sharedDir = path.resolve(__dirname, '../frontend/src/shared');

const config = {
  watchFolders: [sharedDir],
  resolver: {
    extraNodeModules: {
      '@shared': sharedDir,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

---

## Mobile-Specific Components

### Navigation (`src/navigation/RootNavigator.tsx`)

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';

import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import LobbyScreen from '../screens/LobbyScreen';
import RoleBuilderScreen from '../screens/RoleBuilderScreen';
import BrowseScreen from '../screens/BrowseScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';

import { RootStackParamList, MainTabParamList } from './types';
import { theme } from '../styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: { backgroundColor: theme.colors.surface },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
    />
    <Tab.Screen 
      name="Browse" 
      component={BrowseScreen}
      options={{ tabBarIcon: ({ color }) => <SearchIcon color={color} /> }}
    />
    <Tab.Screen 
      name="Create" 
      component={RoleBuilderScreen}
      options={{ tabBarIcon: ({ color }) => <PlusIcon color={color} /> }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ tabBarIcon: ({ color }) => <UserIcon color={color} /> }}
    />
  </Tab.Navigator>
);

export const RootNavigator = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Lobby" component={LobbyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### Home Screen (`src/screens/HomeScreen.tsx`)

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '../hooks/useApi';
import { theme, spacing } from '../styles/theme';

export const HomeScreen = () => {
  const navigation = useNavigation();
  const api = useApi();
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const game = await api.games.create({});
      navigation.navigate('Lobby', { gameId: game.id, isHost: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      Alert.alert('Error', 'Please enter a game code');
      return;
    }
    
    setLoading(true);
    try {
      const result = await api.games.join(gameCode.toUpperCase());
      navigation.navigate('Lobby', { gameId: result.gameId, isHost: false });
    } catch (error) {
      Alert.alert('Error', 'Game not found');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>YourWolf</Text>
      <Text style={styles.subtitle}>One Night Ultimate Werewolf</Text>
      
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleCreateGame}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Game</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>
      
      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder="Enter game code"
          placeholderTextColor={theme.colors.textSecondary}
          value={gameCode}
          onChangeText={setGameCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleJoinGame}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Join Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginVertical: spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: spacing.md,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  orText: {
    color: theme.colors.textSecondary,
    marginHorizontal: spacing.md,
  },
});

export default HomeScreen;
```

### Game Screen (`src/screens/GameScreen.tsx`)

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGame } from '@shared/hooks/useGame';
import { useAudio } from '../hooks/useAudio';
import { NightPhaseOverlay } from '../components/NightPhaseOverlay';
import { DayPhaseView } from '../components/DayPhaseView';
import { VotingView } from '../components/VotingView';
import { ResultsView } from '../components/ResultsView';
import { theme } from '../styles/theme';
import { API_WS_URL } from '../config';

export const GameScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { gameId, playerId } = route.params as { gameId: string; playerId: string };
  
  const { game, connected, sendAction } = useGame(gameId, API_WS_URL);
  const { playNarration, stopAudio } = useAudio();
  
  // Handle phase changes
  useEffect(() => {
    if (!game) return;
    
    // Vibrate on phase change
    Vibration.vibrate(200);
    
    // Play narration if available
    if (game.currentNarration) {
      playNarration(game.currentNarration);
    }
    
    return () => stopAudio();
  }, [game?.phase]);
  
  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }
  
  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }
  
  const myPlayer = game.players.find(p => p.id === playerId);
  
  const renderPhase = () => {
    switch (game.phase) {
      case 'night':
        return (
          <NightPhaseOverlay
            role={myPlayer?.role}
            isAwake={myPlayer?.isAwake}
            timer={game.timer}
            onAction={(action) => sendAction({ type: action.type, target: action.target })}
          />
        );
      case 'day':
        return (
          <DayPhaseView
            players={game.players}
            timer={game.timer}
            myPlayerId={playerId}
          />
        );
      case 'voting':
        return (
          <VotingView
            players={game.players}
            myPlayerId={playerId}
            myVote={myPlayer?.vote}
            timer={game.timer}
            onVote={(targetId) => sendAction({ type: 'vote', target: targetId })}
          />
        );
      case 'ended':
        return (
          <ResultsView
            game={game}
            myPlayerId={playerId}
            onPlayAgain={() => navigation.navigate('Home')}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      {renderPhase()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default GameScreen;
```

### Night Phase Overlay (`src/components/NightPhaseOverlay.tsx`)

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Role, NightAction } from '@shared/types';
import { theme, spacing } from '../styles/theme';

interface Props {
  role: Role | null;
  isAwake: boolean;
  timer: number;
  onAction: (action: NightAction) => void;
}

export const NightPhaseOverlay: React.FC<Props> = ({
  role,
  isAwake,
  timer,
  onAction,
}) => {
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withTiming(isAwake ? 1 : 0.3, { duration: 1000 }),
      -1,
      true
    ),
  }));
  
  if (!isAwake) {
    return (
      <View style={styles.sleepContainer}>
        <Animated.View style={[styles.moonIcon, pulseStyle]}>
          <Text style={styles.moonEmoji}>🌙</Text>
        </Animated.View>
        <Text style={styles.sleepText}>Close your eyes...</Text>
        <Text style={styles.sleepSubtext}>Wait for your turn</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.awakeContainer}>
      <View style={styles.header}>
        <Text style={styles.roleText}>{role?.name}</Text>
        <Text style={styles.timerText}>{timer}s</Text>
      </View>
      
      <Text style={styles.instructionText}>
        {role?.abilities[0]?.instruction || 'Perform your action'}
      </Text>
      
      {role?.abilities.map((ability, index) => (
        <View key={index} style={styles.abilitySection}>
          {ability.actionType === 'peek_center' && (
            <View style={styles.centerCards}>
              {[0, 1, 2].map((cardIndex) => (
                <TouchableOpacity
                  key={cardIndex}
                  style={styles.centerCard}
                  onPress={() => onAction({ type: 'peek', target: `center_${cardIndex}` })}
                >
                  <Text style={styles.cardText}>?</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {ability.actionType === 'swap' && (
            <Text style={styles.swapText}>Tap two players to swap their cards</Text>
          )}
        </View>
      ))}
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => onAction({ type: 'skip' })}
      >
        <Text style={styles.skipText}>Skip Action</Text>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  sleepContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moonIcon: {
    marginBottom: spacing.lg,
  },
  moonEmoji: {
    fontSize: 80,
  },
  sleepText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: '600',
  },
  sleepSubtext: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: spacing.sm,
  },
  awakeContainer: {
    flex: 1,
    backgroundColor: '#1a0a0a',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  roleText: {
    fontSize: 28,
    color: theme.colors.werewolf,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  abilitySection: {
    flex: 1,
    justifyContent: 'center',
  },
  centerCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  centerCard: {
    width: (width - 100) / 3,
    aspectRatio: 0.7,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  cardText: {
    fontSize: 48,
    color: theme.colors.textSecondary,
  },
  swapText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  skipButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});
```

---

## Offline Storage

### Storage Service (`src/services/storage.ts`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role } from '@shared/types';

const KEYS = {
  SAVED_ROLES: 'saved_roles',
  DRAFT_ROLES: 'draft_roles',
  FAVORITE_SETS: 'favorite_sets',
  RECENT_GAMES: 'recent_games',
  USER_PREFERENCES: 'user_preferences',
};

export const storage = {
  // Saved Roles (offline access)
  async getSavedRoles(): Promise<Role[]> {
    const data = await AsyncStorage.getItem(KEYS.SAVED_ROLES);
    return data ? JSON.parse(data) : [];
  },
  
  async saveRole(role: Role): Promise<void> {
    const roles = await this.getSavedRoles();
    const exists = roles.findIndex(r => r.id === role.id);
    
    if (exists >= 0) {
      roles[exists] = role;
    } else {
      roles.push(role);
    }
    
    await AsyncStorage.setItem(KEYS.SAVED_ROLES, JSON.stringify(roles));
  },
  
  async removeRole(roleId: string): Promise<void> {
    const roles = await this.getSavedRoles();
    const filtered = roles.filter(r => r.id !== roleId);
    await AsyncStorage.setItem(KEYS.SAVED_ROLES, JSON.stringify(filtered));
  },
  
  async isRoleSaved(roleId: string): Promise<boolean> {
    const roles = await this.getSavedRoles();
    return roles.some(r => r.id === roleId);
  },
  
  // Draft Roles (work in progress)
  async getDraftRoles(): Promise<Partial<Role>[]> {
    const data = await AsyncStorage.getItem(KEYS.DRAFT_ROLES);
    return data ? JSON.parse(data) : [];
  },
  
  async saveDraft(draft: Partial<Role>): Promise<void> {
    const drafts = await this.getDraftRoles();
    const id = draft.id || `draft_${Date.now()}`;
    const exists = drafts.findIndex(d => d.id === id);
    
    const draftWithId = { ...draft, id, updatedAt: new Date().toISOString() };
    
    if (exists >= 0) {
      drafts[exists] = draftWithId;
    } else {
      drafts.push(draftWithId);
    }
    
    await AsyncStorage.setItem(KEYS.DRAFT_ROLES, JSON.stringify(drafts));
  },
  
  async deleteDraft(draftId: string): Promise<void> {
    const drafts = await this.getDraftRoles();
    const filtered = drafts.filter(d => d.id !== draftId);
    await AsyncStorage.setItem(KEYS.DRAFT_ROLES, JSON.stringify(filtered));
  },
  
  // Recent Games
  async addRecentGame(game: { id: string; code: string; date: string }): Promise<void> {
    const games = await this.getRecentGames();
    games.unshift(game);
    // Keep only last 10
    await AsyncStorage.setItem(KEYS.RECENT_GAMES, JSON.stringify(games.slice(0, 10)));
  },
  
  async getRecentGames(): Promise<Array<{ id: string; code: string; date: string }>> {
    const data = await AsyncStorage.getItem(KEYS.RECENT_GAMES);
    return data ? JSON.parse(data) : [];
  },
  
  // User Preferences
  async getPreferences(): Promise<UserPreferences> {
    const data = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : defaultPreferences;
  },
  
  async setPreferences(prefs: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences();
    await AsyncStorage.setItem(
      KEYS.USER_PREFERENCES,
      JSON.stringify({ ...current, ...prefs })
    );
  },
  
  // Clear all
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};

interface UserPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  nightModeAudio: boolean;
  defaultNightDuration: number;
  defaultDayDuration: number;
}

const defaultPreferences: UserPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
  nightModeAudio: true,
  defaultNightDuration: 10,
  defaultDayDuration: 300,
};
```

### Offline Hook (`src/hooks/useOfflineRoles.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import { Role } from '@shared/types';

export const useOfflineRoles = () => {
  const [savedRoles, setSavedRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSavedRoles();
  }, []);
  
  const loadSavedRoles = async () => {
    try {
      const roles = await storage.getSavedRoles();
      setSavedRoles(roles);
    } finally {
      setLoading(false);
    }
  };
  
  const saveRole = useCallback(async (role: Role) => {
    await storage.saveRole(role);
    await loadSavedRoles();
  }, []);
  
  const removeRole = useCallback(async (roleId: string) => {
    await storage.removeRole(roleId);
    await loadSavedRoles();
  }, []);
  
  const isRoleSaved = useCallback((roleId: string) => {
    return savedRoles.some(r => r.id === roleId);
  }, [savedRoles]);
  
  return {
    savedRoles,
    loading,
    saveRole,
    removeRole,
    isRoleSaved,
    refresh: loadSavedRoles,
  };
};
```

---

## Push Notifications

### Notification Service (`src/services/notifications.ts`)

```typescript
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = 'fcm_token';

export const notifications = {
  async initialize(): Promise<void> {
    // Request permission (iOS)
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (!enabled) {
        console.log('Push notifications not authorized');
        return;
      }
    }
    
    // Configure local notifications
    PushNotification.configure({
      onNotification: (notification) => {
        console.log('Notification:', notification);
        this.handleNotification(notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });
    
    // Create notification channel (Android)
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'yourwolf-game',
          channelName: 'Game Notifications',
          channelDescription: 'Notifications for game events',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );
    }
    
    // Get FCM token
    const token = await messaging().getToken();
    await this.registerToken(token);
    
    // Listen for token refresh
    messaging().onTokenRefresh(this.registerToken);
    
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      this.showLocalNotification(remoteMessage);
    });
  },
  
  async registerToken(token: string): Promise<void> {
    const previousToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    
    if (token !== previousToken) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      
      // Send to backend
      try {
        await fetch('/api/users/me/push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform: Platform.OS }),
        });
      } catch (error) {
        console.error('Failed to register push token:', error);
      }
    }
  },
  
  showLocalNotification(message: any): void {
    PushNotification.localNotification({
      channelId: 'yourwolf-game',
      title: message.notification?.title || 'YourWolf',
      message: message.notification?.body || '',
      data: message.data,
    });
  },
  
  handleNotification(notification: any): void {
    const { data } = notification;
    
    if (data?.type === 'game_starting') {
      // Navigate to game
    } else if (data?.type === 'role_approved') {
      // Show role approved message
    }
  },
  
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(FCM_TOKEN_KEY);
  },
};
```

---

## Audio Service

### Native Audio (`src/services/audio.ts`)

```typescript
import Sound from 'react-native-sound';
import { Platform } from 'react-native';

Sound.setCategory('Playback');

interface AudioCache {
  [key: string]: Sound;
}

class AudioService {
  private cache: AudioCache = {};
  private currentNarration: Sound | null = null;
  
  async preloadSounds(): Promise<void> {
    const sounds = [
      'night_start',
      'wake_up',
      'vote',
      'game_over',
    ];
    
    for (const name of sounds) {
      this.cache[name] = new Sound(
        `${name}.mp3`,
        Sound.MAIN_BUNDLE,
        (error) => {
          if (error) console.error(`Failed to load ${name}:`, error);
        }
      );
    }
  }
  
  play(name: string): void {
    const sound = this.cache[name];
    if (sound) {
      sound.stop(() => {
        sound.play();
      });
    }
  }
  
  async playNarration(url: string): Promise<void> {
    // Stop current narration
    this.stopNarration();
    
    return new Promise((resolve, reject) => {
      this.currentNarration = new Sound(url, '', (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        this.currentNarration?.play((success) => {
          if (!success) {
            console.error('Narration playback failed');
          }
          resolve();
        });
      });
    });
  }
  
  stopNarration(): void {
    if (this.currentNarration) {
      this.currentNarration.stop();
      this.currentNarration.release();
      this.currentNarration = null;
    }
  }
  
  setVolume(volume: number): void {
    Object.values(this.cache).forEach((sound) => {
      sound.setVolume(volume);
    });
  }
  
  release(): void {
    Object.values(this.cache).forEach((sound) => {
      sound.release();
    });
    this.cache = {};
    this.stopNarration();
  }
}

export const audioService = new AudioService();
```

### Audio Hook (`src/hooks/useAudio.ts`)

```typescript
import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { audioService } from '../services/audio';
import { usePreferences } from './usePreferences';

export const useAudio = () => {
  const { soundEnabled } = usePreferences();
  
  useEffect(() => {
    audioService.preloadSounds();
    
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        audioService.stopNarration();
      }
    });
    
    return () => {
      subscription.remove();
      audioService.release();
    };
  }, []);
  
  const play = useCallback((name: string) => {
    if (soundEnabled) {
      audioService.play(name);
    }
  }, [soundEnabled]);
  
  const playNarration = useCallback(async (url: string) => {
    if (soundEnabled) {
      await audioService.playNarration(url);
    }
  }, [soundEnabled]);
  
  const stopAudio = useCallback(() => {
    audioService.stopNarration();
  }, []);
  
  return { play, playNarration, stopAudio };
};
```

---

## Theme

### Theme Configuration (`src/styles/theme.ts`)

```typescript
export const theme = {
  colors: {
    primary: '#8b5cf6',      // Purple
    background: '#0f0f23',   // Dark blue-black
    surface: '#1a1a2e',      // Dark surface
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#2a2a40',
    werewolf: '#ef4444',     // Red
    villager: '#22c55e',     // Green
    neutral: '#f59e0b',      // Amber
    error: '#ef4444',
    success: '#22c55e',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 24, fontWeight: 'bold' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16 },
    caption: { fontSize: 14 },
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};

export const { colors, spacing, typography, borderRadius } = theme;

// Navigation theme
export const navigationTheme = {
  dark: true,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
};
```

---

## App Store Configuration

### iOS (`ios/YourWolf/Info.plist` additions)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>YourWolf needs microphone access for voice chat in games.</string>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>remote-notification</string>
</array>

<key>LSApplicationQueriesSchemes</key>
<array>
    <string>yourwolf</string>
</array>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yourwolf</string>
        </array>
    </dict>
</array>
```

### Android (`android/app/src/main/AndroidManifest.xml` additions)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<application>
    <!-- Deep linking -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="yourwolf" />
        <data android:scheme="https" android:host="yourwolf.app" />
    </intent-filter>
</application>
```

### App Store Metadata

```yaml
# app-store-metadata.yml
app_name: YourWolf
subtitle: Social Deduction with Custom Roles
category: Games
secondary_category: Social Networking

keywords:
  - werewolf
  - mafia
  - party game
  - social deduction
  - one night
  - custom roles
  - multiplayer

description: |
  YourWolf brings One Night Ultimate Werewolf to your phone with a twist - 
  create your own custom roles!
  
  Features:
  • Play One Night Ultimate Werewolf with friends
  • Create custom roles with unique abilities
  • Browse and use community-created roles
  • Offline role storage for playing anywhere
  • Push notifications for game events
  • Beautiful dark theme designed for night play

screenshots:
  - home_screen.png
  - game_night.png
  - role_builder.png
  - browse_roles.png
  - voting.png

privacy_policy_url: https://yourwolf.app/privacy
support_url: https://yourwolf.app/support
```

---

## Tests

### Component Tests

```typescript
// __tests__/screens/HomeScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { useApi } from '../../src/hooks/useApi';

jest.mock('../../src/hooks/useApi');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('HomeScreen', () => {
  const mockApi = {
    games: {
      create: jest.fn(),
      join: jest.fn(),
    },
  };
  
  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue(mockApi);
  });
  
  it('renders create and join options', () => {
    const { getByText, getByPlaceholderText } = render(<HomeScreen />);
    
    expect(getByText('Create Game')).toBeTruthy();
    expect(getByText('Join Game')).toBeTruthy();
    expect(getByPlaceholderText('Enter game code')).toBeTruthy();
  });
  
  it('creates game on button press', async () => {
    mockApi.games.create.mockResolvedValue({ id: 'game-123' });
    
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Create Game'));
    
    await waitFor(() => {
      expect(mockApi.games.create).toHaveBeenCalled();
    });
  });
  
  it('joins game with code', async () => {
    mockApi.games.join.mockResolvedValue({ gameId: 'game-123' });
    
    const { getByText, getByPlaceholderText } = render(<HomeScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Enter game code'), 'ABC123');
    fireEvent.press(getByText('Join Game'));
    
    await waitFor(() => {
      expect(mockApi.games.join).toHaveBeenCalledWith('ABC123');
    });
  });
});
```

```typescript
// __tests__/services/storage.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../../src/services/storage';

describe('storage service', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });
  
  describe('saved roles', () => {
    const testRole = {
      id: 'role-1',
      name: 'Test Role',
      team: 'villager' as const,
      abilities: [],
      win_condition: 'Test wins',
    };
    
    it('saves and retrieves roles', async () => {
      await storage.saveRole(testRole);
      const roles = await storage.getSavedRoles();
      
      expect(roles).toHaveLength(1);
      expect(roles[0].id).toBe('role-1');
    });
    
    it('updates existing role', async () => {
      await storage.saveRole(testRole);
      await storage.saveRole({ ...testRole, name: 'Updated Name' });
      
      const roles = await storage.getSavedRoles();
      expect(roles).toHaveLength(1);
      expect(roles[0].name).toBe('Updated Name');
    });
    
    it('removes role', async () => {
      await storage.saveRole(testRole);
      await storage.removeRole('role-1');
      
      const roles = await storage.getSavedRoles();
      expect(roles).toHaveLength(0);
    });
    
    it('checks if role is saved', async () => {
      await storage.saveRole(testRole);
      
      expect(await storage.isRoleSaved('role-1')).toBe(true);
      expect(await storage.isRoleSaved('role-2')).toBe(false);
    });
  });
  
  describe('drafts', () => {
    it('saves draft with generated id', async () => {
      await storage.saveDraft({ name: 'Draft Role' });
      const drafts = await storage.getDraftRoles();
      
      expect(drafts).toHaveLength(1);
      expect(drafts[0].id).toMatch(/^draft_/);
    });
  });
});
```

---

## Acceptance Criteria

| Criteria | Verification |
|----------|--------------|
| App builds for iOS | Xcode build succeeds |
| App builds for Android | Gradle build succeeds |
| Shared code works | Types/hooks imported correctly |
| Navigation works | Tab + stack navigation |
| Game flow works | Join/play/vote/results |
| Offline storage works | Roles saved/loaded |
| Push notifications work | Receive game notifications |
| Audio plays | Narration during night phase |
| Deep links work | yourwolf://game/CODE opens game |
| App store ready | Screenshots, metadata complete |

---

## Definition of Done

- [ ] React Native project setup
- [ ] Shared code module working
- [ ] Navigation implemented
- [ ] All screens created
- [ ] Game WebSocket connection
- [ ] Offline role storage
- [ ] Push notification setup
- [ ] Audio service working
- [ ] iOS build tested
- [ ] Android build tested
- [ ] Deep linking configured
- [ ] App store metadata prepared
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] App icon and splash screen

---

*Last updated: January 31, 2026*
