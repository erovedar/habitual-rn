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

export default function SettingsScreen() {
  const { user, upgradeGuest, signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <ThemedText type="title">Settings</ThemedText>
        {user?.email ? (
          <SignedInAccount email={user.email} displayName={user.displayName} onSignOut={signOut} />
        ) : (
          <GuestAccount onUpgrade={upgradeGuest} />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function SignedInAccount({
  email,
  displayName,
  onSignOut,
}: {
  email: string;
  displayName: string;
  onSignOut: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await onSignOut();
    setLoading(false);
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText>{displayName}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {email}
      </ThemedText>
      <ThemedButton title="Log out" onPress={handleSignOut} loading={loading} style={styles.button} />
    </ThemedView>
  );
}

function GuestAccount({
  onUpgrade,
}: {
  onUpgrade: (email: string, password: string, displayName: string) => Promise<void>;
}) {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    setError(null);
    setLoading(true);
    try {
      await onUpgrade(email.trim(), password, displayName.trim());
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
    <ThemedView style={styles.section}>
      <ThemedText type="small" themeColor="textSecondary">
        You're using a guest account. Create an account to keep your habits if you switch devices.
      </ThemedText>
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
        title="Create account"
        onPress={handleCreateAccount}
        loading={loading}
        disabled={!email || password.length < 8 || !displayName}
        style={styles.button}
      />
      <ThemedText type="link" onPress={() => router.push('/(auth)/login')} style={styles.link}>
        Already have an account? Log in
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  section: { gap: 12, marginTop: 24 },
  input: { padding: 14, borderRadius: 10, fontSize: 16 },
  button: { marginTop: 8 },
  error: { color: '#d33' },
  link: { textAlign: 'center', marginTop: 8 },
});
