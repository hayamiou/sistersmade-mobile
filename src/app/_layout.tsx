/**
 * src/app/_layout.tsx
 *
 * Layout RACINE : une pile (Stack) qui contient deux groupes, protégés
 * par une GARDE selon la session :
 *   - (tabs) : l'appli, UNIQUEMENT si une utilisatrice est connectée
 *   - (auth) : inscription / connexion, UNIQUEMENT si personne ne l'est
 *
 * <AuthProvider> enveloppe TOUT : n'importe quel écran peut lire la session
 * avec useAuth(). Il initialise aussi Firebase, via le service auth.
 */
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ThemedView } from "@/components/themed-view";
import { AuthProvider, useAuth } from "@/contexts/auth";

SplashScreen.preventAutoHideAsync();

/**
 * Composant séparé : useAuth() doit être appelé SOUS <AuthProvider>.
 * Dans RootLayout lui-même, le Provider n'existe pas encore.
 */
function NavigationRacine() {
  const { session, chargement } = useAuth();

  // État « on ne sait pas encore » : Firebase relit la session persistée.
  // Sans ça, on afficherait une fraction de seconde l'écran de connexion
  // à une utilisatrice déjà connectée.
  if (chargement) {
    return (
      <ThemedView
        style={styles.chargement}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Chargement de ta session"
      >
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const connectee = session !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* guard = false → ces écrans n'existent plus : impossible d'y aller,
          même par un lien. Expo Router redirige vers un écran autorisé. */}
      <Stack.Protected guard={connectee} redirectTo="/connexion">
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!connectee} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <NavigationRacine />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  chargement: { flex: 1, alignItems: "center", justifyContent: "center" },
});