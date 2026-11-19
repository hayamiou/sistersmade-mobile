/**
 * src/app/_layout.tsx
 *
 * Layout RACINE : une pile (Stack) qui contient deux groupes, protégés
 * par une GARDE selon la session :
 *   - (tabs) : l'appli, UNIQUEMENT si une utilisatrice est connectée
 *   - (auth) : inscription / connexion, UNIQUEMENT si personne ne l'est
 *
 * <GestureHandlerRootView> enveloppe TOUT : nécessaire aux gestes (swipe).
 * <AuthProvider> : n'importe quel écran peut lire la session avec useAuth().
 * Il initialise aussi Firebase, via le service auth.
 *
 * Police des titres (SM-8) : chargée ICI, avant tout écran, pour éviter
 * qu'un titre s'affiche une fraction de seconde dans la police système.
 *
 * Tâche de fond (SM-23) : importer tache-de-fond.ts exécute son defineTask
 * dès le démarrage (obligatoire : iOS peut réveiller l'appli sans aucun écran) ;
 * activerTacheDeFond() demande ensuite à iOS de la planifier.
 */
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ThemedView } from "@/components/themed-view";
import { PoliceTitre } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { activerTacheDeFond } from "@/services/tache-de-fond";

SplashScreen.preventAutoHideAsync();

/**
 * Composant séparé : useAuth() doit être appelé SOUS <AuthProvider>.
 * Dans RootLayout lui-même, le Provider n'existe pas encore.
 */
function NavigationRacine() {
  const { session, chargement } = useAuth();

  // La clé (PoliceTitre) devient le nom utilisable dans fontFamily.
  // Chemin relatif : assets/ est à la racine du projet, hors de src/.
  const [policesChargees, erreurPolices] = useFonts({
    [PoliceTitre]: require("../../assets/fonts/SpecialElite-Regular.ttf"),
  });
  // Si la police échoue à charger, on NE BLOQUE PAS l'appli :
  // les titres retombent sur la police système, tout reste utilisable.
  const policesPretes = policesChargees || erreurPolices !== null;

  // État « on ne sait pas encore » : Firebase relit la session persistée,
  // et la police des titres se charge. Sans ça, on afficherait une fraction
  // de seconde l'écran de connexion à une utilisatrice déjà connectée.
  if (chargement || !policesPretes) {
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
        <Stack.Screen name="publier" options={{ presentation: "modal" }} />
      </Stack.Protected>

      <Stack.Protected guard={!connectee} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Une seule fois au démarrage : planifier la tâche de fond (sans effet dans Expo Go).
  useEffect(() => {
    void activerTacheDeFond();
  }, []);

  return (
    <GestureHandlerRootView style={styles.racine}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <NavigationRacine />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1 },
  chargement: { flex: 1, alignItems: "center", justifyContent: "center" },
});