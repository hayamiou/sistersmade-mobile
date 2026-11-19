/**
 * src/hooks/use-demandes.ts
 *
 * Hook custom : la liste des demandes, en temps réel, avec ses états
 * (chargement / erreur / données / hors ligne), prêts à afficher.
 * Les écrans ne savent rien de Firestore ni du cache : ils appellent useDemandes().
 *
 * Hors-ligne (SM-21) — stratégie « stale-while-revalidate » :
 *  1. au montage, on affiche tout de suite la dernière liste enregistrée (cache) ;
 *  2. dès que Firestore répond EN LIGNE, on remplace par la liste fraîche
 *     et on l'enregistre pour la prochaine fois ;
 *  3. HORS LIGNE, on ignore les réponses de Firestore : elles viennent de sa
 *     mémoire et peuvent être vides — elles écraseraient le cache.
 */
import { useEffect, useRef, useState } from "react";

import { useConnexion } from "@/hooks/use-connexion";
import { messageErreur } from "@/services/auth";
import { enregistrerDemandes, lireDemandes } from "@/services/cache-demandes";
import { ecouterDemandes } from "@/services/demandes";
import type { Demande } from "@/types/modeles";

type EtatDemandes = {
  /** null tant qu'on n'a rien (ni cache, ni réponse). */
  demandes: Demande[] | null;
  chargement: boolean;
  /** Message prêt à afficher, ou null. */
  erreur: string | null;
  /** true : pas de réseau, la liste affichée est la dernière enregistrée. */
  horsLigne: boolean;
};

export function useDemandes(): EtatDemandes {
  const enLigne = useConnexion(); // un hook custom qui en utilise un autre : composition
  const [demandes, setDemandes] = useState<Demande[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // useRef : une valeur qui survit aux rendus SANS en déclencher.
  // - recuDuServeur : le cache ne doit jamais écraser une liste fraîche arrivée avant lui ;
  // - enLigneRef : l'abonnement Firestore est créé UNE fois, il lit l'état réseau
  //   à jour via cette référence (sinon il garderait la valeur du premier rendu).
  const recuDuServeur = useRef(false);
  const enLigneRef = useRef(enLigne);

  useEffect(() => {
    enLigneRef.current = enLigne;
  }, [enLigne]);

  // 1. Le cache, tout de suite.
  useEffect(() => {
    let actif = true; // même garde que le debounce de SM-17 : pas de mise à jour après démontage
    lireDemandes().then((cache) => {
      if (actif && cache !== null && !recuDuServeur.current) {
        setDemandes(cache);
      }
    });
    return () => {
      actif = false;
    };
  }, []);

  // 2. Firestore en temps réel.
  useEffect(() => {
    // S'abonne une fois au montage ; React appelle le désabonnement
    // retourné par ecouterDemandes au démontage (pas de fuite mémoire).
    return ecouterDemandes(
      (liste) => {
        if (!enLigneRef.current) return; // 3. hors ligne : on garde le cache
        recuDuServeur.current = true;
        setDemandes(liste);
        setErreur(null); // une réponse arrivée efface une ancienne erreur
        void enregistrerDemandes(liste); // « void » : on n'attend pas, le cache est un bonus
      },
      (e) => setErreur(messageErreur(e)),
    );
  }, []);

  return {
    demandes,
    // On charge tant qu'on n'a ni données ni erreur… et seulement en ligne :
    // hors ligne sans cache, attendre ne servirait à rien.
    chargement: demandes === null && erreur === null && enLigne,
    erreur,
    horsLigne: !enLigne,
  };
}