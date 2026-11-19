/**
 * src/components/ui/bouton.tsx
 *
 * Bouton RÉUTILISABLE, accessible par défaut :
 * - rôle « button », libellé et état (désactivé / occupé) annoncés par VoiceOver ;
 * - zone tactile d'au moins 48 pt ;
 * - indicateur de chargement intégré (évite les doubles envois).
 *
 * Trois variantes, toutes branchées sur le thème (SM-8) :
 * - « principal »  : fond framboise (primary), texte onPrimary ;
 * - « action »     : fond vert sapin (action), texte onAction — réservé à « Je peux aider » ;
 * - « secondaire » : fond transparent, contour et texte de la couleur du texte.
 * Les couleurs « on… » garantissent le contraste AA en clair ET en sombre
 * (en sombre, le fond devient clair, donc le texte devient sombre).
 */
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type Variante = "principal" | "action" | "secondaire";

type Props = {
  libelle: string;
  onPress: () => void;
  /** Affiche une roue de chargement et bloque l'appui. */
  chargement?: boolean;
  desactive?: boolean;
  variante?: Variante;
  /** Précision lue par VoiceOver (ex. « Ouvre l'écran d'inscription »). */
  aide?: string;
};

export function Bouton({
  libelle,
  onPress,
  chargement = false,
  desactive = false,
  variante = "principal",
  aide,
}: Props) {
  // Hook custom du projet : renvoie directement les couleurs du mode courant.
  const couleurs = useTheme();

  const inactif = desactive || chargement;

  // Une seule table de correspondance variante → couleurs : lisible, et
  // TypeScript vérifie qu'aucune variante n'est oubliée (Record<Variante, …>).
  const palettes: Record<Variante, { fond: string; texte: string; contour: string }> = {
    principal: { fond: couleurs.primary, texte: couleurs.onPrimary, contour: couleurs.primary },
    action: { fond: couleurs.action, texte: couleurs.onAction, contour: couleurs.action },
    secondaire: { fond: "transparent", texte: couleurs.text, contour: couleurs.text },
  };
  const { fond, texte, contour } = palettes[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={aide}
      accessibilityState={{ disabled: inactif, busy: chargement }}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: fond, borderColor: contour, opacity: pressed || inactif ? 0.6 : 1 },
      ]}>
      {chargement ? (
        <ActivityIndicator color={texte} />
      ) : (
        <ThemedText style={[styles.texte, { color: texte }]}>{libelle}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  texte: { fontWeight: "600" },
});