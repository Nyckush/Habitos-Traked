import { Tabs } from 'expo-router';
import { StyleSheet, View, useColorScheme } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Colors } from '@/constants/theme';

export default function AppTabsLayout() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  function renderTabIcon(
    focused: boolean,
    color: string,
    size: number,
    activeIcon: string,
    inactiveIcon: string,
  ) {
    return (
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: focused ? theme.backgroundSelected : 'transparent' },
        ]}>
        <MaterialDesignIcons
          name={focused ? activeIcon : inactiveIcon}
          color={focused ? theme.text : color}
          size={focused ? size + 1 : size}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: '#27272A',
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 8,
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 18,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: -4,
          },
          elevation: 18,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) =>
            renderTabIcon(focused, color, size, 'home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habitos',
          tabBarIcon: ({ color, size, focused }) =>
            renderTabIcon(focused, color, size, 'fire', 'fire'),
        }}
      />
      <Tabs.Screen
        name="habits/create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="habits/[habitId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ color, size, focused }) =>
            renderTabIcon(focused, color, size, 'repeat', 'repeat'),
        }}
      />
      <Tabs.Screen
        name="routines/create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routines/[routineId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routines/[routineId]/organize"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routines/[routineId]/habits"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="routines/[routineId]/habits/[habitId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size, focused }) =>
            renderTabIcon(focused, color, size, 'trophy', 'trophy-outline'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    minWidth: 44,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
