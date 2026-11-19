/**
 * src/hooks/use-connexion.ts
 *
 * Hook custom : « est-on en ligne ? », mis à jour en direct.
 * Optimiste au démarrage (true) : on n'affiche le bandeau « hors connexion »
 * que lorsque NetInfo l'a confirmé.
 */
import { useEffect, useState } from "react";

import { ecouterConnexion } from "@/services/connexion";

export function useConnexion(): boolean {
  const [enLigne, setEnLigne] = useState(true);

  // Abonnement au montage, désabonnement au démontage (pas de fuite mémoire).
  useEffect(() => ecouterConnexion(setEnLigne), []);

  return enLigne;
}