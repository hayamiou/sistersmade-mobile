/**
 * src/components/ui/bouton.tsx
 *
 * Bouton RÉUTILISABLE, accessible par défaut :
 * - rôle « button », libellé et état (désactivé / occupé) annoncés par VoiceOver ;
 * - zone tactile d'au moins 48 pt ;
 * - indicateur de chargement intégré (évite les doubles envois).
 * Deux variantes : « principal » (plein) et « secondaire » (contour).
 */
import { ActivityIndicator, Pressable, StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

type Props = {
  libelle: string;
  onPress: () => void;
  /** Affiche une roue de chargement et bloque l'appui. */
  chargement?: boolean;
  desactive?: boolean;
  variante?: "principal" | "secondaire";
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
  const schema = useColorScheme();
  const couleurs = Colors[schema === "dark" ? "dark" : "light"];

  const inactif = desactive || chargement;
  // Principal : fond plein (couleur du texte du thème), texte inversé.
  // Secondaire : fond transparent, contour et texte de la couleur du thème.
  const couleurFond = variante === "principal" ? couleurs.text : "transparent";
  const couleurTexte = variante === "principal" ? couleurs.background : couleurs.text;

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
        { backgroundColor: couleurFond, borderColor: couleurs.text, opacity: pressed || inactif ? 0.6 : 1 },
      ]}>
      {chargement ? (
        <ActivityIndicator color={couleurTexte} />
      ) : (
        <ThemedText style={[styles.texte, { color: couleurTexte }]}>{libelle}</ThemedText>
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