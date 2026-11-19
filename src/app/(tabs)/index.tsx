/**
 * src/app/(tabs)/index.tsx  →  route « / » (onglet Accueil)
 *
 * Liste des demandes d'entraide, en temps réel.
 * - États de la grille : chargement, erreur, vide, succès.
 * - Geste (SM-24) : glisser une carte vers la droite → « Je peux aider »,
 *   avec un bouton équivalent sous chaque carte (accessibilité).
 * L'écran ne connaît pas Firestore : il passe par le hook et le service.
 */
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarteDemandeSwipable } from "@/components/demandes/carte-demande-swipable";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useDemandes } from "@/hooks/use-demandes";
import { messageErreur, seDeconnecter } from "@/services/auth";
import { proposerAide } from "@/services/demandes";
import type { Demande } from "@/types/modeles";

export default function AccueilScreen() {
  const { session } = useAuth();
  const { demandes, chargement, erreur } = useDemandes();

  // Action « Je peux aider » : id de la demande en cours d'envoi, + retours.
  const [aideEnvoi, setAideEnvoi] = useState<string | null>(null);
  const [erreurAide, setErreurAide] = useState<string | null>(null);
  const [succesAide, setSuccesAide] = useState<string | null>(null);

  /** Peut-on se proposer ? Pas sur sa propre demande, ni sur une demande prise. */
  function peutAider(demande: Demande): boolean {
    return (
      session !== null &&
      demande.autriceId !== session.uid &&
      demande.statut === "ouverte" &&
      demande.aidanteId === null
    );
  }

  async function aider(demande: Demande) {
    if (!session) return;
    setErreurAide(null);
    setSuccesAide(null);
    setAideEnvoi(demande.id);
    try {
      await proposerAide(demande, session.uid);
      // La carte se met à jour seule (temps réel) : « Une aidante s'est proposée ».
      setSuccesAide(`Merci ! Tu t'es proposée pour « ${demande.titre} » 🤝`);
    } catch (e) {
      setErreurAide(messageErreur(e));
    } finally {
      setAideEnvoi(null);
    }
  }

  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <FlatList
          data={demandes ?? []}
          keyExtractor={(demande) => demande.id} // key stable et unique (cours, chap. 3)
          renderItem={({ item }) => (
            <CarteDemandeSwipable
              demande={item}
              peutAider={peutAider(item)}
              onAider={() => void aider(item)}
              envoiEnCours={aideEnvoi === item.id}
            />
          )}
          contentContainerStyle={styles.liste}
          ItemSeparatorComponent={() => <View style={styles.separateur} />}
          // En-tête : titre + action principale + retours de l'action « aider ».
          ListHeaderComponent={
            <View style={styles.entete}>
              <ThemedText type="title" accessibilityRole="header">
                Demandes d'entraide
              </ThemedText>
              <Bouton libelle="Publier une demande" onPress={() => router.push("/publier")} />
              <ThemedText type="small">
                Astuce : glisse une demande vers la droite pour proposer ton aide.
              </ThemedText>
              <MessageErreur message={erreur ?? erreurAide} />
              {succesAide && (
                <ThemedText accessibilityRole="alert" style={styles.succes}>
                  {succesAide}
                </ThemedText>
              )}
            </View>
          }
          // Affiché quand la liste est vide : chargement OU vraiment vide.
          ListEmptyComponent={
            chargement ? (
              <ActivityIndicator
                size="large"
                accessibilityLabel="Chargement des demandes"
                style={styles.etat}
              />
            ) : erreur ? undefined : (
              <ThemedText style={styles.etat}>
                Aucune demande pour l'instant. Et si tu publiais la première ? 🌱
              </ThemedText>
            )
          }
          // TEMPORAIRE (SM-12) : déconnexion de test, remplacée par « Mon espace » (SM-36).
          ListFooterComponent={
            <View style={styles.pied}>
              <Bouton libelle="Me déconnecter" variante="secondaire" onPress={() => void seDeconnecter()} />
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, flexDirection: "row", justifyContent: "center" },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  liste: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four, // ne pas passer sous la barre d'onglets
  },
  entete: { gap: Spacing.three, marginBottom: Spacing.four },
  separateur: { height: Spacing.four },
  etat: { marginTop: Spacing.four, textAlign: "center" },
  succes: { fontWeight: "600" },
  pied: { marginTop: Spacing.four },
});