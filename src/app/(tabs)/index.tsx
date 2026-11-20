/**
 * src/app/(tabs)/index.tsx  →  route « / » (onglet Accueil)
 *
 * Liste des demandes d'aide, en temps réel.
 * - États de la grille : chargement, erreur, vide, succès… et hors ligne (SM-21).
 * - Geste (SM-24) : glisser une carte vers la droite → « Je peux aider »,
 *   avec un bouton équivalent dans chaque carte (accessibilité).
 * - Hors ligne : bandeau explicatif, dernière liste enregistrée affichée,
 *   actions d'écriture désactivées (elles ne pourraient pas aboutir).
 * - Suppression (SM-65) : sur SES demandes encore ouvertes, un bouton
 *   « Supprimer », avec une confirmation (action irréversible).
 * - Lien « Comment ça marche ? » vers l'écran d'accueil (SM-64).
 * L'écran ne connaît ni Firestore ni le cache : il passe par le hook et les services.
 */
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarteDemande } from "@/components/demandes/carte-demande";
import { CarteDemandeSwipable } from "@/components/demandes/carte-demande-swipable";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useDemandes } from "@/hooks/use-demandes";
import { useTheme } from "@/hooks/use-theme";
import { messageErreur, seDeconnecter } from "@/services/auth";
import { proposerAide, supprimerDemande } from "@/services/demandes";
import type { Demande } from "@/types/modeles";

export default function AccueilScreen() {
  const { session } = useAuth();
  const { demandes, chargement, erreur, horsLigne } = useDemandes();
  const couleurs = useTheme();

  // Actions sur une carte : id de la demande en cours d'envoi, par action.
  const [aideEnvoi, setAideEnvoi] = useState<string | null>(null);
  const [suppressionEnvoi, setSuppressionEnvoi] = useState<string | null>(null);
  // Retours PARTAGÉS par les deux actions : un seul message à la fois à l'écran.
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [succesAction, setSuccesAction] = useState<string | null>(null);

  /**
   * Peut-on se proposer ? Pas sur sa propre demande, ni sur une demande prise,
   * ni hors ligne (l'écriture resterait en attente sans fin).
   */
  function peutAider(demande: Demande): boolean {
    return (
      !horsLigne &&
      session !== null &&
      demande.autriceId !== session.uid &&
      demande.statut === "ouverte" &&
      demande.aidanteId === null
    );
  }

  async function aider(demande: Demande) {
    if (!session) return;
    setErreurAction(null);
    setSuccesAction(null);
    setAideEnvoi(demande.id);
    try {
      await proposerAide(demande, session.uid);
      // La carte se met à jour seule (temps réel) : « Une aidante s'est proposée ».
      setSuccesAction(`Merci ! Tu t'es proposée pour « ${demande.titre} » 🤝`);
    } catch (e) {
      setErreurAction(messageErreur(e));
    } finally {
      setAideEnvoi(null);
    }
  }

  /**
   * Peut-on supprimer ? Seulement SA demande, encore ouverte et sans aidante,
   * et en ligne. Mêmes conditions que firestore.rules (allow delete).
   */
  function peutSupprimer(demande: Demande): boolean {
    return (
      !horsLigne &&
      session !== null &&
      demande.autriceId === session.uid &&
      demande.statut === "ouverte" &&
      demande.aidanteId === null
    );
  }

  /** Action irréversible → on demande confirmation (boîte native, lue par VoiceOver). */
  function confirmerSuppression(demande: Demande) {
    Alert.alert("Supprimer ta demande ?", `« ${demande.titre} » sera définitivement supprimée.`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void supprimer(demande) },
    ]);
  }

  async function supprimer(demande: Demande) {
    if (!session) return;
    setErreurAction(null);
    setSuccesAction(null);
    setSuppressionEnvoi(demande.id);
    try {
      await supprimerDemande(demande, session.uid);
      // La carte disparaît seule de la liste (temps réel).
      setSuccesAction("Ta demande a bien été supprimée.");
    } catch (e) {
      setErreurAction(messageErreur(e));
    } finally {
      setSuppressionEnvoi(null);
    }
  }

  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <FlatList
          data={demandes ?? []}
          keyExtractor={(demande) => demande.id} // key stable et unique (cours, chap. 3)
          renderItem={({ item }) =>
            // Sa propre demande : pas de geste « aider », mais un bouton « Supprimer ».
            peutSupprimer(item) ? (
              <CarteDemande
                demande={item}
                pied={
                  <Bouton
                    libelle="Supprimer ma demande"
                    variante="secondaire"
                    onPress={() => confirmerSuppression(item)}
                    chargement={suppressionEnvoi === item.id}
                    aide="Demande une confirmation avant de supprimer"
                  />
                }
              />
            ) : (
              <CarteDemandeSwipable
                demande={item}
                peutAider={peutAider(item)}
                onAider={() => void aider(item)}
                envoiEnCours={aideEnvoi === item.id}
              />
            )
          }
          contentContainerStyle={styles.liste}
          ItemSeparatorComponent={() => <View style={styles.separateur} />}
          // En-tête : titre + bandeau hors ligne + action principale + retours.
          ListHeaderComponent={
            <View style={styles.entete}>
              <ThemedText type="title" accessibilityRole="header">
                Demandes d'aide
              </ThemedText>
              <Pressable
                onPress={() => router.push("/bienvenue")}
                accessibilityRole="link"
                accessibilityHint="Ouvre la présentation de SistersMade"
                style={styles.lien}>
                <ThemedText type="linkPrimary">ⓘ Comment ça marche ?</ThemedText>
              </Pressable>

              {/* Hors ligne : TEXTE explicite (jamais la couleur seule), annoncé par VoiceOver. */}
              {horsLigne && (
                <View
                  style={[styles.bandeau, { backgroundColor: couleurs.backgroundSelected }]}
                  accessible
                  accessibilityRole="alert">
                  <ThemedText style={styles.bandeauTexte}>
                    📡 Hors connexion : tu vois les dernières demandes enregistrées. Publier et
                    proposer ton aide reviendront avec le réseau.
                  </ThemedText>
                </View>
              )}

              <Bouton
                libelle="Publier une demande"
                onPress={() => router.push("/publier")}
                desactive={horsLigne}
              />
              <ThemedText type="small">
                Astuce : glisse une demande vers la droite pour proposer ton aide.
              </ThemedText>
              <MessageErreur message={erreur ?? erreurAction} />
              {succesAction && (
                <ThemedText accessibilityRole="alert" style={styles.succes}>
                  {succesAction}
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
                {horsLigne
                  ? "Aucune demande enregistrée sur ce téléphone pour l'instant."
                  : "Aucune demande pour l'instant. Et si tu publiais la première ? 🌱"}
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
  lien: { minHeight: 44, justifyContent: "center" }, // zone tactile minimale Apple
  bandeau: { borderRadius: 12, padding: Spacing.three },
  bandeauTexte: { fontWeight: "600" },
  separateur: { height: Spacing.four },
  etat: { marginTop: Spacing.four, textAlign: "center" },
  succes: { fontWeight: "600" },
  pied: { marginTop: Spacing.four },
});