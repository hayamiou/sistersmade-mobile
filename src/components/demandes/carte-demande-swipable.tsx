/**
 * src/components/demandes/carte-demande-swipable.tsx
 *
 * Enveloppe une CarteDemande avec le GESTE « glisser vers la droite »
 * (obligatoire dans la grille) : le geste révèle un bouton « Je peux aider ».
 * Comme dans Mail sur iOS : on glisse, puis on touche le bouton révélé.
 * Évite un déclenchement accidentel en faisant défiler la liste.
 *
 * Accessibilité : un bouton visible SOUS la carte fait la même chose que
 * le geste (VoiceOver, difficultés motrices) — charte : « une alternative
 * par bouton à chaque geste ». Le geste suit le doigt : pas d'animation
 * décorative imposée (compatible « Réduire les animations »).
 *
 * Si l'utilisatrice ne peut pas aider (sa propre demande, déjà prise),
 * on affiche la carte simple, sans geste ni bouton.
 */
import { Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { CarteDemande } from "@/components/demandes/carte-demande";
import { ThemedText } from "@/components/themed-text";
import { Bouton } from "@/components/ui/bouton";
import { Spacing } from "@/constants/theme";
import type { Demande } from "@/types/modeles";

type Props = {
  demande: Demande;
  /** false : sa propre demande, ou demande déjà prise. */
  peutAider: boolean;
  onAider: () => void;
  envoiEnCours: boolean;
};

// Vert foncé + texte blanc : contraste AA (≥ 4,5:1). Passera dans le thème (SM-8).
const VERT_ACTION = "#1E7B4F";

export function CarteDemandeSwipable({ demande, peutAider, onAider, envoiEnCours }: Props) {
  if (!peutAider) {
    return <CarteDemande demande={demande} />;
  }

  return (
    <View style={styles.bloc}>
      <ReanimatedSwipeable
        friction={2} // la carte suit le doigt deux fois moins vite : plus de contrôle
        leftThreshold={60} // au-delà de 60 pt, la carte reste ouverte
        renderLeftActions={(_progression, _translation, methodes) => (
          <Pressable
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel="Je peux aider"
            onPress={() => {
              methodes.close(); // referme la carte
              onAider();
            }}>
            <ThemedText style={styles.texteAction}>🤝 Je peux aider</ThemedText>
          </Pressable>
        )}>
        <CarteDemande demande={demande} />
      </ReanimatedSwipeable>

      {/* Alternative accessible au geste : même action, sans glisser. */}
      <Bouton
        libelle="Je peux aider"
        variante="secondaire"
        onPress={onAider}
        chargement={envoiEnCours}
        aide="Te propose comme aidante pour cette demande"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  action: {
    backgroundColor: VERT_ACTION,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    marginRight: Spacing.two,
  },
  texteAction: { color: "#FFFFFF", fontWeight: "700" },
});