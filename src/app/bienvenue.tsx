/**
 * src/app/bienvenue.tsx  →  route « /bienvenue »
 *
 * Écran d'ACCUEIL (SM-64) : il dit en quelques lignes à quoi sert SistersMade
 * et comment ça marche.
 *
 * Placé à la RACINE de src/app (et non dans (auth)) : il doit rester
 * accessible connectée OU pas. Le layout racine le déclare HORS des gardes.
 * - Pas connectée : premier écran de l'appli → « Rejoindre » / « J'ai déjà un compte ».
 * - Connectée : ouvert depuis « Comment ça marche ? » → un seul bouton « Retour ».
 *
 * - Aucun service, rien de Firebase : seulement la session, lue avec useAuth().
 * - Le logo est une IMAGE : il reçoit un libellé lu par VoiceOver, et le
 *   nom de l'appli est AUSSI écrit en texte (jamais d'info dans l'image seule).
 * - ScrollView : si les textes sont agrandis (réglage iOS), tout reste lisible.
 */
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { MaxContentWidth, PoliceTitre, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";

// Les 3 étapes du fonctionnement : un tableau plutôt que 3 blocs copiés-collés.
// « as const » : TypeScript connaît le contenu exact, rien ne peut le modifier.
const ETAPES = [
  "Tu publies un besoin ou tu proposes ton aide près de chez toi.",
  "Une voisine te contacte et vous échangez pour vous retrouver.",
  "1 heure donnée = 1 heure à recevoir, quelle que soit l'aide reçue ou offerte.",
] as const;

export default function BienvenueScreen() {
  const { session } = useAuth();
  const connectee = session !== null;

  // Retour : on revient d'où l'on vient (la liste). Si l'écran a été ouvert
  // sans historique (lien direct), on remplace par la liste pour ne pas bloquer.
  function retour() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contenu}>
          {/* Logo transparent : il prend la couleur de fond du thème. */}
          <Image
            source={require("../../assets/images/splash-sistersmade.png")}
            style={styles.logo}
            contentFit="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel="Logo SistersMade"
          />
          <ThemedText style={styles.accroche} themeColor="primary" accessibilityRole="header">
            L'appli inclusive d'entraide entre femmes où le temps est la seule monnaie
          </ThemedText>

          <View style={styles.etapes}>
            <ThemedText type="smallBold" accessibilityRole="header">
              Comment ça marche ?
            </ThemedText>
            {ETAPES.map((texte, index) => (
              // accessible : VoiceOver lit le numéro ET la phrase d'un seul coup.
              <View key={texte} style={styles.etape} accessible>
                <ThemedText type="smallBold" themeColor="primary">
                  {index + 1}.
                </ThemedText>
                <ThemedText style={styles.flex}>{texte}</ThemedText>
              </View>
            ))}
          </View>

          {connectee ? (
            <Bouton libelle="Retour aux demandes" onPress={retour} />
          ) : (
            // Fragment <>…</> : deux boutons sans ajouter de View inutile.
            <>
              <Bouton libelle="Rejoindre SistersMade" onPress={() => router.push("/inscription")} />
              <Bouton
                libelle="J'ai déjà un compte"
                variante="secondaire"
                onPress={() => router.push("/connexion")}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  contenu: { padding: Spacing.four, gap: Spacing.five }, // plus d'air entre les blocs
  logo: { width: "100%", height: 160 },
  centre: { textAlign: "center" },
  accroche: {
    fontFamily: PoliceTitre,
    fontSize: 22, // entre le texte (16) et un titre (32)
    lineHeight: 30,
    fontWeight: "normal", // la police n'a qu'une graisse : ne pas demander de gras à iOS
    textAlign: "center",
  },
  etapes: { gap: Spacing.three }, // plus d'espace entre les étapes
  etape: { flexDirection: "row", gap: Spacing.two },
  flex: { flex: 1 },
});