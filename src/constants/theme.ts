/**
 * Thème SistersMade (SM-8) — couleurs des modes clair et sombre.
 *
 * Sources de la palette :
 *  - palette historique du projet → framboise (#C2185B, version AA du #E91E63) ;
 *  - illustration d'inspiration → crème, rose poudré, bleu nuit, vert sapin ;
 *  - logo → le dégradé corail/rose reste réservé au logo (image).
 *
 * Règle d'accessibilité : chaque paire texte/fond ci-dessous a été vérifiée
 * au contraste WCAG AA (≥ 4,5:1 pour le texte). Les ratios sont notés en commentaire.
 * ⚠️ « primary » et « action » sont des couleurs de FOND de bouton :
 * on écrit dessus avec « onPrimary » / « onAction », jamais du texte bleu nuit.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // --- Clés du template (utilisées par tous les composants existants) ---
    text: '#002A40', //                bleu nuit — 14,4:1 sur le fond, 10,3:1 sur les cartes
    background: '#FEFAF2', //          crème
    backgroundElement: '#F5CDCA', //   rose poudré — cartes, champs
    backgroundSelected: '#EBB3AF', //  rose plus soutenu — puce sélectionnée (texte 8,3:1)
    textSecondary: '#5A4A52', //       8,0:1 sur le fond, 5,7:1 sur les cartes

    // --- Ajouts SistersMade ---
    primary: '#C2185B', //             framboise — boutons principaux
    onPrimary: '#FFFFFF', //           texte sur framboise — 5,9:1
    action: '#002A40', //              bleu nuit (illustration) — « Je peux aider »
    onAction: '#FFFFFF', //            texte sur bleu nuit — 14,9:1
  },
  dark: {
    text: '#F2E9EC', //                15,3:1 sur le fond, 8,9:1 sur la sélection
    background: '#1A1416', //          aubergine très sombre
    backgroundElement: '#3A2A2E', //   cartes, champs — texte 11,4:1
    backgroundSelected: '#4E3940', //  puce sélectionnée
    textSecondary: '#B8A9B0', //       8,1:1 sur le fond, 6,0:1 sur les cartes

    primary: '#F06292', //             framboise claire
    onPrimary: '#1A1416', //           texte SOMBRE sur bouton clair — 5,9:1
    action: '#A7D3F0', //              bleu ciel — bleu nuit inversé pour le mode sombre
    onAction: '#1A1416', //            11,4:1 (bouton sur carte sombre : 8,5:1)
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});


/**
 * Police des titres (SM-8) : Special Elite — Google Fonts, licence Apache 2.0.
 * Ce nom doit être IDENTIQUE à la clé passée à useFonts() dans _layout.tsx.
 * Réservée aux titres : texte courant en police système (lisibilité, dyslexie).
 */
export const PoliceTitre = "SpecialElite";

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;