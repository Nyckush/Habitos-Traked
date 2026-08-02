import { Stack } from 'expo-router';

export default function HabitsStackLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
