import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';
import { getMetaById, listObjetivosWithProgress, type ObjetivoWithProgress } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { pullGoals } from '@/services/goals-sync';

export default function MetaPlanScreen() {
  const { metaId } = useLocalSearchParams<{ metaId?: string }>();
  const { token, user } = useAuth();
  const [metaNombre, setMetaNombre] = useState('');
  const [objetivos, setObjetivos] = useState<ObjetivoWithProgress[]>([]);

  const metaLocalId = typeof metaId === 'string' ? metaId : '';

  const loadData = useCallback(async () => {
    if (!metaLocalId) {
      return;
    }

    const [meta, objetivosData] = await Promise.all([getMetaById(metaLocalId), listObjetivosWithProgress()]);

    setMetaNombre(meta?.nombre ?? '');
    setObjetivos(objetivosData.filter((objetivo) => objetivo.meta_local_id === metaLocalId));
  }, [metaLocalId]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (token && user) {
          await pullGoals(token, user.id);
        }

        await loadData();
      })();
    }, [loadData, token, user]),
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.replace('/metas')}
                hitSlop={12}
                style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
                <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
              </Pressable>

              <View style={styles.headerTitleBlock}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.headerTitleIcon}>
                    <MaterialDesignIcons name="trophy-outline" size={16} color="#FFFFFF" />
                  </View>

                  <ThemedText style={styles.headerTitle}>Planificar Meta</ThemedText>
                </View>

                <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                  {metaNombre ? `Meta: ${metaNombre}` : 'Organiza tus objetivos'}
                </ThemedText>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            {objetivos.length === 0 ? (
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                Todavia no hay objetivos para esta meta.
              </ThemedText>
            ) : (
              objetivos.map((objetivo) => (
                <Pressable
                  key={objetivo.local_id}
                  onPress={() =>
                    router.push({
                      pathname: '/metas/[metaId]/objectives/create',
                      params: {
                        metaId: metaLocalId,
                        objectiveId: objetivo.local_id,
                        objectiveName: objetivo.nombre,
                        selectedHabitIds: objetivo.habitos_local_ids.join(','),
                        metaEsperada: String(objetivo.meta_esperada),
                        fechaLimite: objetivo.fecha_limite,
                      },
                    })
                  }
                  style={({ pressed }) => [styles.objetivoCard, pressed && styles.buttonPressed]}>
                  <ThemedText>{objetivo.nombre}</ThemedText>
                  <ThemedText themeColor="textSecondary">{`Estado: ${objetivo.estado}`}</ThemedText>
                  <ThemedText themeColor="textSecondary">{`${objetivo.habitos_local_ids.length} habitos asociados`}</ThemedText>
                  <ThemedText themeColor="textSecondary">{`Progreso: ${objetivo.meta_actual}/${objetivo.meta_esperada}`}</ThemedText>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() =>
          router.push({
            pathname: '/metas/[metaId]/objectives/create',
            params: { metaId: metaLocalId },
          })
        }
        style={({ pressed }) => [styles.floatingButton, pressed && styles.buttonPressed]}>
        <MaterialDesignIcons name="plus" size={22} color="#FFFFFF" />
        <ThemedText style={styles.floatingButtonText}>Crear Objetivo</ThemedText>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: 16,
  },
  headerSpacer: {
    width: 32,
  },
  objetivoCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    backgroundColor: '#18181B',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: BottomTabInset + 92,
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
  emptyText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 56,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  backButton: {
    width: 32,
    minHeight: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
