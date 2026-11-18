/**
 * src/app/_layout.tsx
 *
 * Layout RACINE : une pile (Stack) qui contient deux groupes :
 *   - (tabs) : l'appli, pour les utilisatrices connectées
 *   - (auth) : inscription / connexion
 * SM-12 ajoutera la garde qui choisit le groupe selon la session.
 *
 * <AuthProvider> enveloppe TOUT : n'importe quel écran peut lire la session
 * avec useAuth(). Il initialise aussi Firebase, via le service auth.
 */
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/contexts/auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {/* headerShown: false : chaque groupe gère son propre affichage */}
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </AuthProvider>
  );
}