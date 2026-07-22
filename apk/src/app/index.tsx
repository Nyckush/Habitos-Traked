import { ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return <Redirect href={token ? '/home' : '/auth/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
