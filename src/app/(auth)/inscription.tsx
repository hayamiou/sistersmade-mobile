/**
 * src/app/(auth)/inscription.tsx  →  route « /inscription »
 *
 * Écran d'inscription : pseudo, e-mail, mot de passe.
 * L'écran ne connaît PAS Firebase : il appelle le service auth (ADR-001).
 */
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { inscrire, messageErreur, MOT_DE_PASSE_MIN, validerInscription } from "@/services/auth";

export default function InscriptionScreen() {
  const schema = useColorScheme();
  const couleurs = Colors[schema === "dark" ? "dark" : "light"];

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

    // 2. Appel au service. Le bouton est désactivé pendant l'envoi :
    //    impossible de créer deux comptes par double appui.
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await inscrire(donnees);
      // replace (et non push) : on ne doit pas pouvoir « revenir » à l'inscription.
      router.replace("/");
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // Style commun aux champs, adapté au mode clair / sombre.
  const styleChamp = [styles.champ, { color: couleurs.text, borderColor: couleurs.backgroundElement }];

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

            <ThemedText>Pseudo</ThemedText>
            <TextInput
              style={styleChamp}
              value={pseudo}
              onChangeText={setPseudo}
              placeholder="Ex. : Lune_du_quartier"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              accessibilityLabel="Pseudo"
              accessibilityHint="Visible par les autres membres. Pas besoin de ton vrai prénom."
            />

            <ThemedText>Adresse e-mail</ThemedText>
            <TextInput
              style={styleChamp}
              value={email}
              onChangeText={setEmail}
              placeholder="toi@exemple.fr"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              accessibilityLabel="Adresse e-mail"
            />

            <ThemedText>Mot de passe</ThemedText>
            <TextInput
              style={styleChamp}
              value={motDePasse}
              onChangeText={setMotDePasse}
              placeholder={`${MOT_DE_PASSE_MIN} caractères minimum`}
              placeholderTextColor="#888"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              accessibilityLabel="Mot de passe"
              accessibilityHint={`${MOT_DE_PASSE_MIN} caractères minimum`}
            />

            {/* accessibilityRole="alert" : VoiceOver annonce l'erreur dès qu'elle apparaît. */}
            {erreur && (
              <ThemedText style={styles.erreur} accessibilityRole="alert">
                {erreur}
              </ThemedText>
            )}

            <Pressable
              onPress={valider}
              disabled={envoiEnCours}
              style={({ pressed }) => [
                styles.bouton,
                { backgroundColor: couleurs.text, opacity: pressed || envoiEnCours ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Créer mon compte"
              accessibilityState={{ disabled: envoiEnCours, busy: envoiEnCours }}>
              {envoiEnCours ? (
                <ActivityIndicator color={couleurs.background} />
              ) : (
                <ThemedText style={[styles.texteBouton, { color: couleurs.background }]}>
                  Créer mon compte
                </ThemedText>
              )}
            </Pressable>
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
  champ: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  erreur: { color: "#D93025" },
  // minHeight 48 : zone tactile confortable (accessibilité).
  bouton: { marginTop: Spacing.three, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  texteBouton: { fontWeight: "600" },
});