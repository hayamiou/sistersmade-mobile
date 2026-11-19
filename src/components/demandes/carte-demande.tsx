/**
 * src/components/demandes/carte-demande.tsx
 *
 * Carte d'une demande dans la liste. Composant PUR : il reçoit une Demande
 * et l'affiche, sans état ni appel réseau (mêmes props → même rendu).
 * Accessible : la carte est lue d'un seul bloc par VoiceOver, avec une
 * phrase complète (titre, autrice, durée, catégorie, statut).
 */
import { StyleSheet, useColorScheme, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { libelleDuree } from "@/services/demandes";
import { CATEGORIES } from "@/types/categories";
import type { Demande } from "@/types/modeles";

type Props = {
  demande: Demande;
};

export function CarteDemande({ demande }: Props) {
  const schema = useColorScheme();
  const couleurs = Colors[schema === "dark" ? "dark" : "light"];

  // La 1re catégorie est la principale (décision du 17/11).
  const principale = CATEGORIES.find((c) => c.code === demande.categories[0]);
  const duree = libelleDuree(demande.dureeEstimee);
  const date = demande.creeLe.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  // Statut affiché en TEXTE + emoji (jamais par la couleur seule).
  const statut =
    demande.statut === "en_cours"
      ? "🤝 Une aidante s'est proposée"
      : demande.statut === "terminee"
        ? "✅ Terminée"
        : null; // « ouverte » : rien à signaler

  // Une phrase complète pour VoiceOver, au lieu de 5 éléments lus séparément.
  const annonce =
    `${demande.titre}. Demandée par ${demande.autricePseudo}, le ${date}. ` +
    `Durée estimée : ${duree}.` +
    (principale ? ` Catégorie : ${principale.libelle}.` : "") +
    (statut ? ` ${statut}.` : "");

  return (
    <View
      style={[styles.carte, { backgroundColor: couleurs.backgroundElement }]}
      accessible
      accessibilityLabel={annonce}>
      {principale && (
        <ThemedText type="small" style={{ color: couleurs.textSecondary }}>
          {principale.emoji} {principale.libelle}
        </ThemedText>
      )}
      <ThemedText style={styles.titre}>{demande.titre}</ThemedText>
      <ThemedText numberOfLines={3}>{demande.description}</ThemedText>
      <ThemedText type="small" style={{ color: couleurs.textSecondary }}>
        {demande.autricePseudo} · {duree} · {date}
      </ThemedText>
      {statut && <ThemedText type="small" style={styles.statut}>{statut}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  titre: { fontWeight: "600" },
  statut: { fontWeight: "600" },
});