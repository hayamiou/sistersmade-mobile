/**
 * src/components/ecran-verrou.tsx
 *
 * Écran affiché tant que l'appli est verrouillée (SM-45).
 * Composant PUR : il affiche l'état reçu et signale l'appui sur le bouton ;
 * toute la logique (Face ID, décision) vit dans le hook useVerrou.
 *
 * Accessibilité : titre annoncé comme en-tête, explication en texte, erreur
 * annoncée (MessageErreur), bouton pour relancer — on n'est jamais bloquée
 * sans action possible. iOS propose aussi le code de l'iPhone.
 */
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MaxContentWidth, Spacing } from "@/constants/theme";

type Props = {
  erreur: string | null;
  onDeverrouiller: () => void;
};

export function EcranVerrou({ erreur, onDeverrouiller }: Props) {
  return (
    <ThemedView style={styles.conteneur}>
      <View style={styles.contenu}>
        <ThemedText type="title" accessibilityRole="header">
          SistersMade
        </ThemedText>
        <ThemedText>
          🔒 Ton espace est protégé. Déverrouille-le avec Face ID ou avec le code de ton iPhone.
        </ThemedText>
        <MessageErreur message={erreur} />
        <Bouton
          libelle="Déverrouiller"
          onPress={onDeverrouiller}
          aide="Ouvre la demande Face ID"
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: {
    width: "100%",
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
});