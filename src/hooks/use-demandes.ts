/**
 * src/hooks/use-demandes.ts
 *
 * Hook custom : la liste des demandes, en temps réel, avec ses trois états
 * (chargement / erreur / données), prêts à afficher.
 * Les écrans ne savent rien de Firestore : ils appellent useDemandes().
 */
import { useEffect, useState } from "react";

import { messageErreur } from "@/services/auth";
import { ecouterDemandes } from "@/services/demandes";
import type { Demande } from "@/types/modeles";

type EtatDemandes = {
  /** null tant que la première réponse n'est pas arrivée. */
  demandes: Demande[] | null;
  chargement: boolean;
  /** Message prêt à afficher, ou null. */
  erreur: string | null;
};

export function useDemandes(): EtatDemandes {
  const [demandes, setDemandes] = useState<Demande[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // S'abonne une fois au montage ; React appelle le désabonnement
    // retourné par ecouterDemandes au démontage (pas de fuite mémoire).
    return ecouterDemandes(
      (liste) => {
        setDemandes(liste);
        setErreur(null); // une réponse arrivée efface une ancienne erreur
      },
      (e) => setErreur(messageErreur(e)),
    );
  }, []);

  return {
    demandes,
    // On charge tant qu'on n'a ni données ni erreur.
    chargement: demandes === null && erreur === null,
    erreur,
  };
}