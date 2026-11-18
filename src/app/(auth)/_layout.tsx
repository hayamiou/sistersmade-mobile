/**
 * src/app/(auth)/_layout.tsx
 *
 * Pile du groupe (auth). L'ORDRE des écrans compte : le premier est celui
 * qu'on affiche par défaut quand la garde envoie ici (après une déconnexion,
 * ou au premier lancement). On veut la connexion, pas l'inscription.
 */
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="connexion" />
      <Stack.Screen name="inscription" />
    </Stack>
  );
}