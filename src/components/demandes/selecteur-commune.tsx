/**
 * src/components/demandes/selecteur-commune.tsx
 *
 * Choix de la commune d'une demande, de DEUX façons (charte d'inclusion) :
 * 1. « 📍 Utiliser ma position » : localisation approximative + API Géo ;
 * 2. saisie manuelle avec suggestions (toujours possible, même si la
 *    localisation est refusée ou indisponible).
 * Composant CONTRÔLÉ : la commune choisie vit chez le parent (valeur / onChange).
 */
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Bouton } from "@/components/ui/bouton";
import { ChampTexte } from "@/components/ui/champ-texte";
import { MessageErreur } from "@/components/ui/message-erreur";
import { Puce } from "@/components/ui/puce";
import { Spacing } from "@/constants/theme";
import { messageErreur } from "@/services/auth";
import { communeDepuisPosition, rechercherCommunes, type SuggestionCommune } from "@/services/geo";
import { positionApproximative } from "@/services/localisation";
import type { Commune } from "@/types/modeles";

type Props = {
  valeur: Commune | null;
  onChange: (commune: Commune | null) => void;
  desactive?: boolean;
};

/** Délai avant d'interroger l'API, pour ne pas l'appeler à chaque lettre. */
const DELAI_RECHERCHE_MS = 400;

export function SelecteurCommune({ valeur, onChange, desactive = false }: Props) {
  const [recherche, setRecherche] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionCommune[]>([]);
  const [localisationEnCours, setLocalisationEnCours] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Recherche « différée » (debounce) : on attend que l'utilisatrice
  // arrête de taper 400 ms avant d'appeler l'API.
  useEffect(() => {
    let annulee = false; // ignore une réponse arrivée après une nouvelle frappe
    const minuteur = setTimeout(() => {
      rechercherCommunes(recherche)
        .then((resultats) => {
          if (!annulee) setSuggestions(resultats);
        })
        .catch((e: unknown) => {
          if (!annulee) setErreur(messageErreur(e));
        });
    }, DELAI_RECHERCHE_MS);

    // Nettoyage (cours, chap. 3) : à chaque nouvelle frappe ou au démontage,
    // on annule le minuteur précédent — pas d'appel inutile, pas de fuite.
    return () => {
      annulee = true;
      clearTimeout(minuteur);
    };
  }, [recherche]);

  async function utiliserMaPosition() {
    setErreur(null);
    setInfo(null);
    setLocalisationEnCours(true);
    try {
      const coordonnees = await positionApproximative();
      if (coordonnees === null) {
        setInfo("Pas de souci : tape simplement le nom de ta commune ci-dessous.");
        return;
      }
      const commune = await communeDepuisPosition(coordonnees.latitude, coordonnees.longitude);
      if (commune === null) {
        setInfo("Aucune commune trouvée à cet endroit. Tape son nom ci-dessous.");
        return;
      }
      onChange(commune);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setLocalisationEnCours(false);
    }
  }

  function choisir(suggestion: SuggestionCommune) {
    onChange(suggestion.commune);
    setRecherche("");
    setSuggestions([]);
  }

  // ---- Commune déjà choisie : on l'affiche, avec un bouton pour changer ----
  if (valeur) {
    return (
      <View style={styles.bloc}>
        <ThemedText accessibilityLabel={`Commune choisie : ${valeur.nom}`}>📍 {valeur.nom}</ThemedText>
        <Bouton libelle="Changer de commune" variante="secondaire" onPress={() => onChange(null)} desactive={desactive} />
      </View>
    );
  }

  // ---- Pas encore de commune : position OU saisie manuelle ----
  return (
    <View style={styles.bloc}>
      <Bouton
        libelle="📍 Utiliser ma position"
        variante="secondaire"
        onPress={() => void utiliserMaPosition()}
        chargement={localisationEnCours}
        desactive={desactive}
        aide="Trouve ta commune. Ta position exacte n'est jamais enregistrée."
      />
      {info && <ThemedText type="small">{info}</ThemedText>}
      <MessageErreur message={erreur} />

      <ChampTexte
        libelle="Ou tape ta commune"
        value={recherche}
        onChangeText={(texte) => {
          setErreur(null);
          setRecherche(texte);
        }}
        placeholder="Ex. : Mérignac"
        autoCorrect={false}
        editable={!desactive}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestions} accessibilityRole="radiogroup">
          {suggestions.map((s) => (
            <Puce
              key={s.commune.codeInsee}
              role="radio"
              libelle={s.codePostal ? `${s.commune.nom} (${s.codePostal})` : s.commune.nom}
              selectionnee={false}
              onPress={() => choisir(s)}
              desactivee={desactive}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});