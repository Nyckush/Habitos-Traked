import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';
import { listMetasWithEstado, type MetaWithEstado } from '@/database';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { pullGoals } from '@/services/goals-sync';

export default function MetasListScreen() {
  const { token, user } = useAuth();
  const { isReady } = useDatabase();
  const [metas, setMetas] = useState<MetaWithEstado[]>([]);

  const loadData = useCallback(async () => {
    const metasData = await listMetasWithEstado();
    setMetas(metasData);
  }, []);

  const refreshData = useCallback(async () => {
    if (token && user) {
      await pullGoals(token, user.id);
    }

    await loadData();
  }, [loadData, token, user]);

  const { refreshing, handleRefresh } = usePullToRefresh(refreshData);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) {
        return;
      }

      const timerId = setTimeout(() => {
        void refreshData();
      }, 0);

      return () => clearTimeout(timerId);
    }, [isReady, refreshData]),
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <MaterialDesignIcons name="trophy-outline" size={18} color="#FFFFFF" />
              </View>

              <ThemedText style={styles.title}>Mis metas</ThemedText>
            </View>

            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Listado de Metas
            </ThemedText>

            {metas.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay metas cargadas.</ThemedText>
            ) : (
              metas.map((meta) => (
                <View key={meta.local_id} style={styles.metaCard}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/metas/[metaId]',
                        params: { metaId: meta.local_id },
                      })
                    }
                    style={({ pressed }) => [pressed && styles.buttonPressed]}>
                    <ThemedText>{meta.nombre}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Estado: ${meta.estado}`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Inicio: ${meta.fecha_inicio ?? 'Sin fecha'}`}</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/metas/[metaId]/plan',
                        params: { metaId: meta.local_id },
                      })
                    }
                    style={({ pressed }) => [styles.planButton, pressed && styles.buttonPressed]}>
                    <ThemedText style={styles.planButtonText}>Planificar</ThemedText>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push('/metas/create')}
        style={({ pressed }) => [styles.floatingButton, pressed && styles.buttonPressed]}>
        <MaterialDesignIcons name="plus" size={22} color="#FFFFFF" />
        <ThemedText style={styles.floatingButtonText}>Crear Meta</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: BottomTabInset + 32,
  },
  content: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  subtitle: {
    textAlign: 'left',
    marginTop: 24,
  },
  metaCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    backgroundColor: '#18181B',
  },
  planButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 122,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
