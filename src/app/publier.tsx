/**
 * src/app/publier.tsx  →  route « /publier », présentée en MODALE
 *
 * Formulaire de publication d'une demande d'entraide.
 * - Ne connaît PAS Firebase : passe par le service demandes (ADR-001).
 * - Trois états visibles (grille de notation) : chargement (bouton occupé),
 *   erreur (message annoncé), succès (écran de confirmation).
 * - Commune (SM-17) : par position approximative OU saisie manuelle.
 * - Accessible : puces checkbox / radio, coche en plus de la couleur,
 *   bouton « Annuler » en alternative au geste de fermeture.
 */
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SelecteurCommune } from "@/components/demandes/selecteur-commune";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { ChampTexte } from "@/components/ui/champ-texte";
import { MessageErreur } from "@/components/ui/message-erreur";
import { Puce } from "@/components/ui/puce";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { messageErreur } from "@/services/auth";
import {
  DESCRIPTION_MAX,
  DUREES_POSSIBLES,
  libelleDuree,
  publierDemande,
  TITRE_MAX,
  validerDemande,
} from "@/services/demandes";
import { CATEGORIES, type Categorie, NB_MAX_CATEGORIES } from "@/types/categories";
import type { Commune, NouvelleDemande } from "@/types/modeles";

export default function PublierScreen() {
  const { session } = useAuth();

  // Un état par champ (composants contrôlés).
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [duree, setDuree] = useState<number | null>(null);
  const [commune, setCommune] = useState<Commune | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [publiee, setPubliee] = useState(false);

  /** Coche / décoche une catégorie (forme fonctionnelle : état précédent fiable). */
  function basculerCategorie(code: Categorie) {
    setCategories((precedentes) => {
      if (precedentes.includes(code)) return precedentes.filter((c) => c !== code);
      if (precedentes.length >= NB_MAX_CATEGORIES) return precedentes; // sécurité
      return [...precedentes, code]; // la 1re cochée reste la principale
    });
  }

  async function valider() {
    // La garde garantit une session ici ; ce test rassure TypeScript.
    if (!session) return;

    // duree ?? 0 : « pas encore choisie » → 0, que validerDemande refuse.
    const donnees: NouvelleDemande = { titre, description, categories, dureeEstimee: duree ?? 0 };

    // 1. Validation locale : retour immédiat, sans réseau.
    const probleme = validerDemande(donnees);
    if (probleme) {
      setErreur(probleme);
      return;
    }

    // 2. Publication (le solde est vérifié par le service ET par les règles).
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await publierDemande(session.uid, donnees, commune);
      setPubliee(true);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // ---- État SUCCÈS : écran de confirmation ----
  if (publiee) {
    return (
      <ThemedView style={styles.conteneur}>
        <SafeAreaView style={[styles.safeArea, styles.succes]}>
          <ThemedText type="title" style={styles.centre} accessibilityRole="header">
            Demande publiée 🎉
          </ThemedText>
          <ThemedText style={styles.centre}>
            Les femmes de ton quartier peuvent maintenant te proposer leur aide.
          </ThemedText>
          <Bouton libelle="Fermer" onPress={() => router.back()} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ---- Formulaire ----
  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" accessibilityRole="header">
              De quoi as-tu besoin ?
            </ThemedText>

            <ChampTexte
              libelle="Titre"
              value={titre}
              onChangeText={setTitre}
              placeholder="Ex. : Accompagnement à un rendez-vous"
              maxLength={TITRE_MAX}
            />

            <ChampTexte
              libelle="Description"
              aide="Explique ton besoin : quoi, quand, où (sans adresse précise)."
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={DESCRIPTION_MAX}
              style={styles.zoneTexte}
            />
            {/* Compteur : évite la surprise de la limite atteinte. */}
            <ThemedText type="small" style={styles.compteur}>
              {description.length} / {DESCRIPTION_MAX} caractères
            </ThemedText>

            <ThemedText style={styles.section} accessibilityRole="header">
              Catégories (1 ou {NB_MAX_CATEGORIES})
            </ThemedText>
            <View style={styles.puces}>
              {CATEGORIES.map((c) => {
                const cochee = categories.includes(c.code);
                const pleine = !cochee && categories.length >= NB_MAX_CATEGORIES;
                return (
                  <Puce
                    key={c.code}
                    libelle={`${c.emoji} ${c.libelle}`}
                    selectionnee={cochee}
                    onPress={() => basculerCategorie(c.code)}
                    desactivee={pleine || envoiEnCours}
                    aide={pleine ? `${NB_MAX_CATEGORIES} catégories maximum` : undefined}
                  />
                );
              })}
            </View>

            <ThemedText style={styles.section} accessibilityRole="header">
              Durée estimée
            </ThemedText>
            <View style={styles.puces} accessibilityRole="radiogroup">
              {DUREES_POSSIBLES.map((d) => (
                <Puce
                  key={d}
                  libelle={libelleDuree(d)}
                  role="radio"
                  selectionnee={duree === d}
                  onPress={() => setDuree(d)}
                  desactivee={envoiEnCours}
                />
              ))}
            </View>

            <ThemedText style={styles.section} accessibilityRole="header">
              Où ? (facultatif)
            </ThemedText>
            <SelecteurCommune valeur={commune} onChange={setCommune} desactive={envoiEnCours} />

            <MessageErreur message={erreur} />

            <Bouton libelle="Publier ma demande" onPress={valider} chargement={envoiEnCours} />
            {/* Alternative par bouton au geste de fermeture de la modale. */}
            <Bouton libelle="Annuler" variante="secondaire" onPress={() => router.back()} desactive={envoiEnCours} />
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
  succes: { justifyContent: "center", padding: Spacing.four, gap: Spacing.three },
  centre: { textAlign: "center" },
  zoneTexte: { minHeight: 120, textAlignVertical: "top" },
  compteur: { alignSelf: "flex-end", marginTop: -Spacing.two },
  section: { fontWeight: "600", marginTop: Spacing.two },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});