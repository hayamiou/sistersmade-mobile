/**
 * src/services/geo.ts
 *
 * API Géo (geo.api.gouv.fr) : service PUBLIC, gratuit, sans clé.
 * C'est l'« API externe » de la grille de notation.
 * - communeDepuisPosition : coordonnées → commune (une seule)
 * - rechercherCommunes    : nom tapé → suggestions (saisie manuelle)
 *
 * Vie privée : on ne garde JAMAIS les coordonnées, seulement la commune.
 * Données externes : reçues en `unknown`, vérifiées par type guard (cours).
 */
import { ErreurMetier } from "@/services/erreurs";
import type { Commune } from "@/types/modeles";

const API = "https://geo.api.gouv.fr/communes";

/** Une suggestion = la commune + son code postal, pour distinguer les homonymes. */
export type SuggestionCommune = {
  commune: Commune;
  /** Ex. « 33700 » : affiché seulement, jamais enregistré. */
  codePostal: string | null;
};

/** Forme d'une commune renvoyée par l'API (vérifiée champ par champ). */
type CommuneApi = { nom: string; code: string; codesPostaux?: unknown };

function estCommuneApi(v: unknown): v is CommuneApi {
  return (
    typeof v === "object" && v !== null &&
    "nom" in v && typeof v.nom === "string" &&
    "code" in v && typeof v.code === "string"
  );
}

/** Appelle l'API et renvoie un tableau de valeurs NON vérifiées. */
async function appeler(url: string): Promise<unknown[]> {
  let reponse: Response;
  try {
    reponse = await fetch(url);
  } catch {
    // fetch n'échoue (catch) qu'en cas de problème réseau.
    throw new ErreurMetier("Pas de connexion : impossible de trouver la commune. Réessaie plus tard.");
  }
  if (!reponse.ok) {
    throw new ErreurMetier("Le service des communes ne répond pas. Réessaie dans un instant.");
  }
  const donnees: unknown = await reponse.json();
  return Array.isArray(donnees) ? donnees : [];
}

/** Coordonnées → commune (ou null si aucune, par ex. en pleine mer). */
export async function communeDepuisPosition(latitude: number, longitude: number): Promise<Commune | null> {
  const url = `${API}?lat=${latitude}&lon=${longitude}&fields=nom,code&format=json`;
  const premiere = (await appeler(url)).find(estCommuneApi);
  return premiere ? { nom: premiere.nom, codeInsee: premiere.code } : null;
}

/** Nom tapé → jusqu'à 5 suggestions, les plus peuplées d'abord. */
export async function rechercherCommunes(nom: string): Promise<SuggestionCommune[]> {
  const recherche = nom.trim();
  if (recherche.length < 2) return []; // pas d'appel inutile pour 0 ou 1 lettre

  // encodeURIComponent : « Saint-Médard-en-Jalles » contient des accents et des tirets.
  const url = `${API}?nom=${encodeURIComponent(recherche)}&fields=nom,code,codesPostaux&boost=population&limit=5`;

  return (await appeler(url)).filter(estCommuneApi).map((c) => ({
    commune: { nom: c.nom, codeInsee: c.code },
    codePostal:
      Array.isArray(c.codesPostaux) && typeof c.codesPostaux[0] === "string" ? c.codesPostaux[0] : null,
  }));
}