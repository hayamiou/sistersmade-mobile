/**
 * src/components/demandes/carte-demande-swipable.tsx
 *
 * Enveloppe une CarteDemande avec le GESTE « glisser vers la droite »
 * (obligatoire dans la grille) : le geste révèle un bouton « Je peux aider ».
 * Comme dans Mail sur iOS : on glisse, puis on touche le bouton révélé.
 * Évite un déclenchement accidentel en faisant défiler la liste.
 *
 * Accessibilité : un bouton visible DANS la carte (pied, hors du bloc lu par
 * VoiceOver) fait la même chose que le geste (VoiceOver, difficultés motrices)
 * — charte : « une alternative par bouton à chaque geste ». Le geste suit le
 * doigt : pas d'animation décorative imposée (compatible « Réduire les animations »).
 *
 * Couleur (SM-8) : le geste et le bouton partagent la couleur « action » du
 * thème (vert sapin) — même action, même couleur.
 *
 * Si l'utilisatrice ne peut pas aider (sa propre demande, déjà prise),
 * on affiche la carte simple, sans geste ni bouton.
 */
import { Pressable, StyleSheet } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { CarteDemande } from "@/components/demandes/carte-demande";
import { ThemedText } from "@/components/themed-text";
import { Bouton } from "@/components/ui/bouton";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Demande } from "@/types/modeles";

type Props = {
  demande: Demande;
  /** false : sa propre demande, ou demande déjà prise. */
  peutAider: boolean;
  onAider: () => void;
  envoiEnCours: boolean;
};

export function CarteDemandeSwipable({ demande, peutAider, onAider, envoiEnCours }: Props) {
  const couleurs = useTheme();

  if (!peutAider) {
    return <CarteDemande demande={demande} />;
  }

  return (
    <ReanimatedSwipeable
      friction={2} // la carte suit le doigt deux fois moins vite : plus de contrôle
      leftThreshold={60} // au-delà de 60 pt, la carte reste ouverte
      renderLeftActions={(_progression, _translation, methodes) => (
        <Pressable
          style={[styles.action, { backgroundColor: couleurs.action }]}
          accessibilityRole="button"
          accessibilityLabel="Je peux aider"
          onPress={() => {
            methodes.close(); // referme la carte
            onAider();
          }}>
          <ThemedText style={[styles.texteAction, { color: couleurs.onAction }]}>
            🤝 Je peux aider
          </ThemedText>
        </Pressable>
      )}>
      <CarteDemande
        demande={demande}
        pied={
          // Alternative accessible au geste : même action, sans glisser.
          <Bouton
            libelle="🤝 Je peux aider"
            variante="action"
            onPress={onAider}
            chargement={envoiEnCours}
            aide="Te propose comme aidante pour cette demande"
          />
        }
      />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    marginRight: Spacing.two,
  },
  texteAction: { fontWeight: "700" },
});