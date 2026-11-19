/**
 * src/components/demandes/carte-demande.tsx
 *
 * Carte d'une demande dans la liste. Composant PUR : il reçoit une Demande
 * et l'affiche, sans état ni appel réseau (mêmes props → même rendu).
 *
 * Accessible : le CONTENU est lu d'un seul bloc par VoiceOver, avec une
 * phrase complète (titre, autrice, durée, lieu, catégorie, statut).
 *
 * Structure en deux étages (SM-8) :
 *  - le CADRE (fond rose poudré, coins arrondis) n'est PAS regroupé ;
 *  - le CONTENU, lui, est regroupé (accessible) et porte la phrase VoiceOver ;
 *  - un PIED facultatif (ex. bouton « Je peux aider ») vit dans le cadre mais
 *    HORS du groupe : sinon VoiceOver ne pourrait plus atteindre le bouton.
 */
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { libelleDuree } from "@/services/demandes";
import { CATEGORIES } from "@/types/categories";
import type { Demande } from "@/types/modeles";

type Props = {
  demande: Demande;
  /** Contenu affiché en bas de la carte, hors du bloc lu par VoiceOver. */
  pied?: ReactNode;
};

export function CarteDemande({ demande, pied }: Props) {
  const couleurs = useTheme();

  // La 1re catégorie est la principale (décision du 17/11).
  const principale = CATEGORIES.find((c) => c.code === demande.categories[0]);
  const duree = libelleDuree(demande.dureeEstimee);
  const date = demande.creeLe.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  // Commune facultative : on n'ajoute « · 📍 Mérignac » que si elle existe.
  const lieu = demande.commune ? ` · 📍 ${demande.commune.nom}` : "";

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
    (demande.commune ? ` À ${demande.commune.nom}.` : "") +
    (principale ? ` Catégorie : ${principale.libelle}.` : "") +
    (statut ? ` ${statut}.` : "");

  return (
    // CADRE : porte le fond et l'arrondi, mais ne regroupe rien.
    <View style={[styles.carte, { backgroundColor: couleurs.backgroundElement }]}>
      {/* CONTENU : un seul élément pour VoiceOver. */}
      <View style={styles.contenu} accessible accessibilityLabel={annonce}>
        {principale && (
          <ThemedText type="small" style={{ color: couleurs.textSecondary }}>
            {principale.emoji} {principale.libelle}
          </ThemedText>
        )}
        <ThemedText style={styles.titre}>{demande.titre}</ThemedText>
        <ThemedText numberOfLines={3}>{demande.description}</ThemedText>
        <ThemedText type="small" style={{ color: couleurs.textSecondary }}>
          {demande.autricePseudo} · {duree} · {date}
          {lieu}
        </ThemedText>
        {statut && (
          <ThemedText type="small" style={styles.statut}>
            {statut}
          </ThemedText>
        )}
      </View>

      {/* PIED : rendu seulement s'il est fourni, atteignable par VoiceOver. */}
      {pied}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three, // espace entre le contenu et le pied
  },
  contenu: { gap: Spacing.one },
  titre: { fontWeight: "600" },
  statut: { fontWeight: "600" },
});