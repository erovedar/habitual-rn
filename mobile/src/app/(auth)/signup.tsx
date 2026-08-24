import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';

// A wholly new, separate account — not the guest-preserving path. Guests
// wanting to keep their current habits/check-ins should use the "create an
// account" flow in settings.tsx (POST /auth/upgrade) instead.
export default function SignupScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/');
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'email_taken'
          ? 'An account with that email already exists.'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <ThemedText type="title">Sign up</ThemedText>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name"
          placeholderTextColor={theme.textSecondary}
          autoComplete="name"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min. 8 characters)"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoComplete="new-password"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}
        <ThemedButton
          title="Sign up"
          onPress={handleSubmit}
          loading={loading}
          disabled={!email || password.length < 8 || !displayName}
          style={styles.button}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  input: { padding: 14, borderRadius: 10, fontSize: 16 },
  button: { marginTop: 8 },
  error: { color: '#d33' },
});
