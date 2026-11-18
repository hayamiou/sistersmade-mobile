/**
 * src/components/ui/message-erreur.tsx
 *
 * Message d'erreur RÉUTILISABLE.
 * - N'affiche rien si le message est null : l'écran n'a pas à faire de `if`.
 * - accessibilityRole="alert" : VoiceOver l'annonce dès qu'il apparaît.
 * - Icône ⚠️ + texte : l'erreur ne repose jamais sur la couleur seule.
 */
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";

type Props = { message: string | null };

export function MessageErreur({ message }: Props) {
  if (!message) return null;
  return (
    <ThemedText style={styles.erreur} accessibilityRole="alert">
      ⚠️ {message}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  // ❓ Contraste en mode sombre à vérifier lors de l'audit (SM-25) / du thème (SM-8).
  erreur: { color: "#D93025" },
});