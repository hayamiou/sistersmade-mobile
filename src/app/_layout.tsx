/**
 * src/app/_layout.tsx
 *
 * Layout RACINE : une pile (Stack) qui contient deux groupes :
 *   - (onglets) : l'appli, pour les utilisatrices connectées
 *   - (auth)    : inscription / connexion
 * SM-12 ajoutera la garde qui choisit le groupe selon la session.
 */
// TEMPORAIRE (SM-12) : initialise Firebase au démarrage. Sera retiré quand
// le hook d'authentification importera lui-même le service.
import "@/services/firebase";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* headerShown: false : chaque groupe gère son propre affichage */}
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
