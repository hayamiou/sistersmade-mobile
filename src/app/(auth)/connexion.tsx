/**
 * src/app/(auth)/connexion.tsx  →  route « /connexion »
 *
 * Écran de connexion : e-mail + mot de passe.
 * - Ne connaît PAS Firebase : passe par le service auth (ADR-001).
 * - Même structure que l'inscription, grâce aux composants src/components/ui.
 */
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { ChampTexte } from "@/components/ui/champ-texte";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { messageErreur, seConnecter, validerConnexion } from "@/services/auth";

export default function ConnexionScreen() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function valider() {
    const donnees = { email, motDePasse };

    // 1. Validation locale : champs vides → message immédiat, sans réseau.
    const probleme = validerConnexion(donnees);
    if (probleme) {
      setErreur(probleme);
      return;
    }

    // 2. Appel au service ; le Bouton affiche le chargement et se bloque.
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await seConnecter(donnees);
      // replace : une fois connectée, « retour » ne doit pas ramener ici.
      router.replace("/");
    } catch (e) {
      // Mauvais identifiants → « E-mail ou mot de passe incorrect. »
      // (volontairement sans préciser lequel : voir MESSAGES dans auth.ts)
      setErreur(messageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.titre} accessibilityRole="header">
              Te revoilà !
            </ThemedText>
            <ThemedText style={styles.sousTitre}>
              Connecte-toi pour retrouver tes sœurs d'entraide.
            </ThemedText>

            <ChampTexte
              libelle="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="toi@exemple.fr"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <ChampTexte
              libelle="Mot de passe"
              value={motDePasse}
              onChangeText={setMotDePasse}
              secureTextEntry
              // « password » / « current-password » : iOS propose le trousseau
              // (et non un nouveau mot de passe comme à l'inscription).
              textContentType="password"
              autoComplete="current-password"
            />

            <MessageErreur message={erreur} />

            <Bouton libelle="Me connecter" onPress={valider} chargement={envoiEnCours} />

            <Bouton
              libelle="Pas encore de compte ? Rejoindre SistersMade"
              variante="secondaire"
              onPress={() => router.push("/inscription")}
              desactive={envoiEnCours}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  flex: { flex: 1 },
  contenu: { padding: Spacing.four, gap: Spacing.three },
  titre: { textAlign: "center" },
  sousTitre: { textAlign: "center", marginBottom: Spacing.three },
});