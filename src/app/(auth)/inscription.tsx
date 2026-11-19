/**
 * src/app/(auth)/inscription.tsx  →  route « /inscription »
 *
 * Écran d'inscription : pseudo, e-mail, mot de passe.
 * - L'écran ne connaît PAS Firebase : il appelle le service auth (ADR-001).
 * - Les champs, le bouton et l'erreur sont des composants réutilisables
 *   (src/components/ui), accessibles par défaut.
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
import { inscrire, messageErreur, MOT_DE_PASSE_MIN, validerInscription } from "@/services/auth";

export default function InscriptionScreen() {
  // Un état par champ (« composants contrôlés ») : l'écran est la source de vérité.
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function valider() {
    const donnees = { pseudo, email, motDePasse };

    // 1. Validation locale : retour immédiat, sans appel réseau.
    const probleme = validerInscription(donnees);
    if (probleme) {
      setErreur(probleme);
      return;
    }

    // 2. Appel au service. Le Bouton se bloque pendant l'envoi (prop `chargement`).
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await inscrire(donnees);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea}>
        {/* Remonte le formulaire quand le clavier s'ouvre (iOS). */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.titre} accessibilityRole="header">
              Rejoindre SistersMade
            </ThemedText>
            <ThemedText style={styles.sousTitre}>
              L'entraide entre femmes, où le temps est la monnaie.
            </ThemedText>

            <ChampTexte
              libelle="Pseudo"
              aide="Visible par les autres membres. Pas besoin de ton vrai prénom."
              value={pseudo}
              onChangeText={setPseudo}
              placeholder="Ex. : Lune_du_quartier"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />

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
              aide={`${MOT_DE_PASSE_MIN} caractères minimum`}
              value={motDePasse}
              onChangeText={setMotDePasse}
              placeholder={`${MOT_DE_PASSE_MIN} caractères minimum`}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />

            <MessageErreur message={erreur} />

                        <Bouton libelle="Créer mon compte" onPress={valider} chargement={envoiEnCours} />

            <Bouton
              libelle="Déjà inscrite ? Me connecter"
              variante="secondaire"
              onPress={() => router.back()}
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