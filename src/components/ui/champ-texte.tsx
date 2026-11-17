/**
 * src/components/ui/champ-texte.tsx
 *
 * Champ de saisie RÉUTILISABLE : un libellé visible + un TextInput,
 * accessible par défaut et adapté au mode clair / sombre.
 *
 * Il accepte TOUTES les props d'un TextInput (`...reste`) : chaque écran
 * garde la main sur le clavier, l'autoremplissage, secureTextEntry, etc.
 */
import { StyleSheet, TextInput, useColorScheme, View, type TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

type Props = TextInputProps & {
  /** Texte affiché au-dessus du champ, ET lu par VoiceOver. */
  libelle: string;
  /** Précision lue par VoiceOver après le libellé (ex. « 8 caractères minimum »). */
  aide?: string;
};

export function ChampTexte({ libelle, aide, style, ...reste }: Props) {
  const schema = useColorScheme();
  const couleurs = Colors[schema === "dark" ? "dark" : "light"];

  return (
    <View style={styles.bloc}>
      <ThemedText>{libelle}</ThemedText>
      <TextInput
        placeholderTextColor="#888"
        // Valeurs par défaut d'accessibilité : un écran peut les surcharger
        // via `reste`, car `{...reste}` vient APRÈS.
        accessibilityLabel={libelle}
        accessibilityHint={aide}
        {...reste}
        // Le style du thème d'abord, puis celui éventuellement fourni par l'écran.
        style={[styles.champ, { color: couleurs.text, borderColor: couleurs.backgroundElement }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: 8 },
  champ: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});