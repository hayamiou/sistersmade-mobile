/**
 * src/app/(tabs)/index.tsx  →  route « / » (onglet Accueil)
 *
 * Liste des demandes d'entraide, en temps réel.
 * Les trois états de la grille sont gérés : chargement, erreur, vide
 * (et succès = la liste). L'écran ne connaît pas Firestore : il passe
 * par le hook useDemandes().
 */
import { router } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarteDemande } from "@/components/demandes/carte-demande";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useDemandes } from "@/hooks/use-demandes";
import { seDeconnecter } from "@/services/auth";

export default function AccueilScreen() {
  const { demandes, chargement, erreur } = useDemandes();

  return (
    <ThemedView style={styles.conteneur}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <FlatList
          data={demandes ?? []}
          keyExtractor={(demande) => demande.id} // key stable et unique (cours, chap. 3)
          renderItem={({ item }) => <CarteDemande demande={item} />}
          contentContainerStyle={styles.liste}
          ItemSeparatorComponent={() => <View style={styles.separateur} />}
          // En-tête : titre + action principale.
          ListHeaderComponent={
            <View style={styles.entete}>
              <ThemedText type="title" accessibilityRole="header">
                Demandes d'entraide
              </ThemedText>
              <Bouton libelle="Publier une demande" onPress={() => router.push("/publier")} />
              <MessageErreur message={erreur} />
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
  separateur: { height: Spacing.three },
  etat: { marginTop: Spacing.four, textAlign: "center" },
  pied: { marginTop: Spacing.four },
});