/**
 * src/constants/banque-temps.ts
 * Règles chiffrées de la banque de temps (crédit mutuel, décision du 17/11).
 */
/** Solde d'une nouvelle inscrite : 0 h. Pas de bonus (pas d'heures « fantômes »). */
export const SOLDE_INITIAL = 0;
/** Découvert autorisé : une nouvelle venue peut demander jusqu'à 2 h avant d'avoir aidé. Vérifié lors de l'échange (SM-19). */
export const DECOUVERT_MAX_HEURES = 2;
