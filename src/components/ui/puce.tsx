/**
 * src/components/ui/puce.tsx
 *
 * Puce (« chip ») SÉLECTIONNABLE, réutilisable, accessible par défaut :
 * - rôle « checkbox » (choix multiple : catégories) ou « radio » (choix
 *   unique : durée), avec l'état coché annoncé par VoiceOver ;
 * - l'état sélectionné ne passe JAMAIS par la couleur seule : une coche ✓
 *   s'affiche aussi (charte d'accessibilité) ;
 * - zone tactile d'au moins 44 pt.
 * Composant PUR : il n'a pas d'état, le parent décide (props → affichage).
 */
import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

type Props = {
  libelle: string;
  selectionnee: boolean;
  onPress: () => void;
  /** checkbox = plusieurs choix possibles ; radio = un seul choix. */
  role?: "checkbox" | "radio";
  desactivee?: boolean;
  /** Précision lue par VoiceOver (ex. « 2 catégories maximum »). */
  aide?: string;
};

export function Puce({
  libelle,
  selectionnee,
  onPress,
  role = "checkbox",
  desactivee = false,
  aide,
}: Props) {
  const schema = useColorScheme();
  const couleurs = Colors[schema === "dark" ? "dark" : "light"];

  // Sélectionnée : fond plein, texte inversé (comme le Bouton principal).
  // Non sélectionnée : fond discret, contour.
  const couleurFond = selectionnee ? couleurs.text : couleurs.backgroundElement;
  const couleurTexte = selectionnee ? couleurs.background : couleurs.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={desactivee}
      accessibilityRole={role}
      accessibilityLabel={libelle}
      accessibilityHint={aide}
      accessibilityState={{ checked: selectionnee, disabled: desactivee }}
      style={({ pressed }) => [
        styles.puce,
        {
          backgroundColor: couleurFond,
          borderColor: couleurs.text,
          opacity: pressed || desactivee ? 0.5 : 1,
        },
      ]}>
      <ThemedText style={[styles.texte, { color: couleurTexte }]}>
        {/* La coche double la couleur : l'info ne repose pas que sur elle. */}
        {selectionnee ? `✓ ${libelle}` : libelle}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puce: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  texte: { fontWeight: "500" },
});