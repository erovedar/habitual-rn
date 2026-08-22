import { Stack } from 'expo-router';

// Wraps every authenticated screen. Auth-gating (redirect to (auth)/login
// when signed out) lands in Phase 1.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
