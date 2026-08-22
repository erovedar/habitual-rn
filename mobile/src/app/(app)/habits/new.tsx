import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Habit creation form (name + reminder-time picker, 5-habit cap) lands in Phase 2.
export default function NewHabitScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <ThemedText type="title">New habit</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});
