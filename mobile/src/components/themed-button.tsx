import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ThemedButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  loading?: boolean;
};

export function ThemedButton({ title, loading, disabled, style, ...rest }: ThemedButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        { backgroundColor: theme.text, opacity: disabled || loading ? 0.5 : state.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText type="smallBold" style={{ color: theme.background }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
