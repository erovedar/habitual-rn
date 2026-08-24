import { Stack } from 'expo-router';

// Wraps every authenticated screen. Auth-gating happens one level up, in the
// root layout's Stack.Protected.
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
