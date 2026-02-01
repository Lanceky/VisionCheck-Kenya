import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="test-suite" />
      <Stack.Screen name="eye-photo" />
      <Stack.Screen name="results" />
      <Stack.Screen name="history" />
      <Stack.Screen name="clinics" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
