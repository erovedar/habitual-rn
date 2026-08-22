import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Signup/login form + AuthContext wiring lands in Phase 1.
export default function LoginScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <ThemedText type="title">Log in</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
});
