import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, useColorScheme } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComponentProps } from 'react';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

type MaterialIconName = ComponentProps<typeof MaterialDesignIcons>['name'];

export default function AppTabsLayout() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const activeTabColor = '#208AEF';
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const profileUri = user?.perfil ?? null;
  const bottomInset = 0;
  const tabBarBottomOffset = 0;
  const navigationSessionKey = token && user ? `auth-${user.id}` : 'guest';

  function renderTabIcon(
    focused: boolean,
    color: string,
    size: number,
    activeIcon: MaterialIconName,
    inactiveIcon: MaterialIconName,
  ) {
    return (
      <View style={styles.iconContainer}>
        <MaterialDesignIcons
          name={focused ? activeIcon : inactiveIcon}
          color={focused ? activeTabColor : color}
          size={focused ? size + 1 : size}
        />
      </View>
    );
  }

  function renderProfileTabIcon(focused: boolean, color: string, size: number) {
    return (
      <View style={[styles.iconContainer, styles.profileIconContainer]}>
        {profileUri ? (
          <Image
            source={{ uri: profileUri }}
            resizeMode="contain"
            style={[
              styles.profileTabImage,
              {
                width: focused ? size + 10 : size + 8,
                height: focused ? size + 10 : size + 8,
                borderColor: focused ? activeTabColor : '#27272A',
              },
            ]}
          />
        ) : (
          <MaterialDesignIcons
            name={focused ? 'account-circle' : 'account-circle-outline'}
            color={focused ? activeTabColor : color}
            size={focused ? size + 3 : size + 2}
          />
        )}
      </View>
    );
  }

  return (
    <Tabs
      key={navigationSessionKey}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTabColor,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: '#27272A',
          borderTopWidth: 1,
          height: 62 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          paddingHorizontal: 4,
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 50,
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
          flex: 1,
          minWidth: 0,
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
        name="routines"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ color, size, focused }) =>
            renderTabIcon(focused, color, size, 'repeat', 'repeat'),
        }}
      />

      
      <Tabs.Screen
        name="metas"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size, focused }) =>
            renderTabIcon(focused, color, size, 'trophy', 'trophy-outline'),
        }}
      />

         <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => renderProfileTabIcon(focused, color, size),
        }}
      />
   
      <Tabs.Screen
        name="tasks/create"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconContainer: {
    width: '100%',
    height: '100%',
  },
  profileTabImage: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#0A0A0C',
  },
});
