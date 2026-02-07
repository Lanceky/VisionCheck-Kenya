import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="test-suite"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="visual-acuity"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="color-vision"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="astigmatism"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="clinics"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
