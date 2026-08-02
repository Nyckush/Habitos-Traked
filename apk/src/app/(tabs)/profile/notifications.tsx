import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getNotificationSettings,
  type NotificationSettings,
  type NotificationTone,
  updateNotificationSettings,
} from '@/database';
import { syncScheduledNotificationsAsync } from '@/services/notifications';

const TONE_OPTIONS: {
  value: NotificationTone;
  title: string;
  description: string;
}[] = [
  {
    value: 'default',
    title: 'Predeterminado',
    description: 'Usa el sonido normal del sistema para la notificacion.',
  },
  {
    value: 'silent',
    title: 'Silencioso',
    description: 'La notificacion llega sin sonido.',
  },
  {
    value: 'notificacion1',
    title: 'Tono 1',
    description: 'Usa el sonido notificacion1 de la app.',
  },
  {
    value: 'notificacion2',
    title: 'Tono 2',
    description: 'Usa el sonido notificacion2 de la app.',
  },
  {
    value: 'notificacion3',
    title: 'Tono 3',
    description: 'Usa el sonido notificacion3 de la app.',
  },
];

export default function ProfileNotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    tone: 'default',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const nextSettings = await getNotificationSettings();
    setSettings(nextSettings);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  async function handleToggleEnabled(value: boolean) {
    try {
      setSaving(true);
      setError(null);

      const nextSettings = await updateNotificationSettings({ enabled: value });
      setSettings(nextSettings);
      await syncScheduledNotificationsAsync();
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : 'No se pudo actualizar las notificaciones.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectTone(tone: NotificationTone) {
    try {
      setSaving(true);
      setError(null);

      const nextSettings = await updateNotificationSettings({ tone });
      setSettings(nextSettings);
      await syncScheduledNotificationsAsync();
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : 'No se pudo actualizar el tono.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="bell-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Notificaciones</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Ajusta el sonido y el estado de los recordatorios
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionCopy}>
                <ThemedText style={styles.sectionTitle}>Activar notificaciones</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.sectionDescription}>
                  Programa recordatorios para tareas y habitos con hora.
                </ThemedText>
              </View>

              <Switch
                value={settings.enabled}
                disabled={saving}
                onValueChange={(value) => {
                  void handleToggleEnabled(value);
                }}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#3F3F46', true: '#27272A' }}
              />
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <ThemedText style={styles.blockTitle}>Tono de la notificacion</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.blockSubtitle}>
              Puedes elegir el sonido del sistema, modo silencioso o uno de los tonos de la app.
            </ThemedText>
          </View>

          {TONE_OPTIONS.map((option) => {
            const selected = settings.tone === option.value;

            return (
              <Pressable
                key={option.value}
                disabled={saving || !settings.enabled}
                onPress={() => {
                  void handleSelectTone(option.value);
                }}
                style={({ pressed }) => [
                  styles.optionCard,
                  selected && styles.optionCardSelected,
                  (!settings.enabled || saving) && styles.optionCardDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <View style={styles.optionCopy}>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.optionDescription}>
                    {option.description}
                  </ThemedText>
                </View>

                <MaterialDesignIcons
                  name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color={selected ? '#FFFFFF' : '#A1A1AA'}
                />
              </Pressable>
            );
          })}

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
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
  },
  headerSpacer: {
    width: 32,
  },
  sectionCard: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#18181B',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sectionCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionDescription: {
    lineHeight: 20,
  },
  sectionBlock: {
    gap: 4,
  },
  blockTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  blockSubtitle: {
    lineHeight: 20,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionCardSelected: {
    backgroundColor: '#1E1E24',
    borderColor: '#3F3F46',
  },
  optionCardDisabled: {
    opacity: 0.55,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionDescription: {
    lineHeight: 20,
  },
  errorText: {
    color: '#DC2626',
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
  buttonPressed: {
    opacity: 0.85,
  },
});
