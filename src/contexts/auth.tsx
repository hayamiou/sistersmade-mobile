/**
 * src/contexts/auth.tsx
 *
 * RÔLE : rendre la session (connectée ou non) disponible PARTOUT dans l'appli,
 * sans la passer d'écran en écran (« prop drilling »).
 *
 * - <AuthProvider> enveloppe l'appli (dans src/app/_layout.tsx) et écoute
 *   la session via le service auth : il ne connaît PAS Firebase (ADR-001).
 * - useAuth() est le hook custom que les écrans utilisent pour la lire.
 */
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { ecouterSession, type Session } from "@/services/auth";

/** Ce que le contexte expose aux écrans. */
interface EtatAuth {
  /** La session, ou null si personne n'est connecté. */
  session: Session | null;
  /**
   * true tant que Firebase n'a pas encore dit s'il retrouvait une session
   * persistée (au démarrage). Sans ça, on afficherait une fraction de seconde
   * l'écran de connexion à une utilisatrice déjà connectée (« flash »).
   */
  chargement: boolean;
}

/*
 * Valeur par défaut `undefined` : elle ne sert QUE si un composant appelle
 * useAuth() hors du Provider. On détecte ce cas plus bas pour planter tôt
 * avec un message clair, plutôt que de renvoyer une fausse session vide.
 */
const AuthContexte = createContext<EtatAuth | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    // ecouterSession retourne la fonction de désabonnement :
    // la retourner ici permet à React de l'appeler au démontage (pas de fuite).
    return ecouterSession((nouvelleSession) => {
      setSession(nouvelleSession);
      setChargement(false); // la première réponse arrive : on sait enfin.
    });
  }, []); // [] : on s'abonne une seule fois, au montage.

  // useMemo : l'objet n'est recréé que si session ou chargement change.
  // Sinon, chaque rendu du Provider re-rendrait TOUS les consommateurs.
  const valeur = useMemo<EtatAuth>(() => ({ session, chargement }), [session, chargement]);

  return <AuthContexte.Provider value={valeur}>{children}</AuthContexte.Provider>;
}

/** Hook custom : lire la session depuis n'importe quel écran. */
export function useAuth(): EtatAuth {
  const etat = useContext(AuthContexte);
  // Garde : après ce if, TypeScript sait que `etat` est EtatAuth (plus undefined).
  if (etat === undefined) {
    throw new Error("useAuth() doit être utilisé à l'intérieur de <AuthProvider>.");
  }
  return etat;
}