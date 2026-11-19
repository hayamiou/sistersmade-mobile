/**
 * src/hooks/use-verrou.ts
 *
 * Hook custom : faut-il afficher l'écran de verrouillage (SM-45) ?
 *
 * Règles :
 *  - on décide UNE seule fois, quand la session est connue (pret = true) ;
 *  - session déjà ouverte au démarrage → verrou Face ID ;
 *  - pas de session au démarrage → pas de verrou de toute la durée de l'appli
 *    (après une connexion par mot de passe, Face ID ferait double emploi) ;
 *  - pas de biométrie sur l'appareil → pas de verrou (on ne bloque personne).
 */
import { useEffect, useRef, useState } from "react";

import { authentifier, biometrieDisponible } from "@/services/biometrie";

type EtatVerrou = {
  /** true tant qu'on ne sait pas encore s'il faut verrouiller. */
  enCours: boolean;
  verrouillee: boolean;
  /** Message prêt à afficher après un échec, ou null. */
  erreur: string | null;
  /** Relance la demande Face ID (bouton de l'écran de verrouillage). */
  reessayer: () => void;
};

export function useVerrou(pret: boolean, connectee: boolean): EtatVerrou {
  const [enCours, setEnCours] = useState(true);
  const [verrouillee, setVerrouillee] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // useRef : la décision n'est prise qu'une fois, même si le composant se redessine.
  const decisionPrise = useRef(false);

  async function demanderFaceId() {
    setErreur(null);
    const reconnue = await authentifier();
    if (reconnue) {
      setVerrouillee(false);
    } else {
      setErreur("Déverrouillage annulé ou non reconnu. Tu peux réessayer.");
    }
  }

  useEffect(() => {
    if (!pret || decisionPrise.current) return;
    decisionPrise.current = true;

    if (!connectee) {
      setEnCours(false); // personne de connecté au démarrage : pas de verrou
      return;
    }

    void (async () => {
      const disponible = await biometrieDisponible();
      setEnCours(false);
      if (!disponible) return; // pas de Face ID : on laisse entrer
      setVerrouillee(true);
      await demanderFaceId(); // la demande iOS s'affiche par-dessus l'écran de verrouillage
    })();
    // demanderFaceId n'utilise que des setters (stables) : inutile dans les dépendances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, connectee]);

  return {
    enCours,
    verrouillee,
    erreur,
    reessayer: () => void demanderFaceId(),
  };
}