/**
 * src/types/categories.ts
 *
 * RÔLE : la liste OFFICIELLE des catégories de SistersMade.
 *
 * PRINCIPE « UNE SEULE SOURCE DE VÉRITÉ » :
 * la liste est écrite UNE fois ici. Le type `Categorie`, les libellés,
 * les emojis et les validations en sont tous DÉDUITS. Ajouter une catégorie
 * = ajouter UNE ligne ci-dessous, TypeScript répercute partout.
 *
 * Le `code` est ce qui est stocké dans Firestore : il ne doit JAMAIS changer
 * (sinon les anciennes demandes pointeraient vers une catégorie inconnue).
 * Le `libelle` et l'`emoji`, eux, peuvent évoluer librement.
 */

export const CATEGORIES = [
  { code: "pas_seule", libelle: "Pas toute seule", emoji: "🤝" },
  { code: "paperasse", libelle: "Paperasse & droits", emoji: "📑" },
  { code: "carriere", libelle: "Carrière & reconversion", emoji: "🚀" },
  { code: "argent", libelle: "Argent & autonomie", emoji: "💸" },
  { code: "numerique", libelle: "Numérique & sécurité", emoji: "🔐" },
  { code: "reparer", libelle: "Réparer & monter", emoji: "🛠️" },
  { code: "relais", libelle: "Relais du quotidien", emoji: "🫶" },
  { code: "apprendre", libelle: "Apprendre & transmettre", emoji: "🎓" },
  { code: "bouger", libelle: "Bouger ensemble", emoji: "🏃‍♀️" },
  { code: "sortir", libelle: "Sortir ensemble", emoji: "🎶" },
] as const;

/**
 * Le type `Categorie` est CALCULÉ à partir de la liste :
 * "pas_seule" | "paperasse" | ... | "sortir".
 * `(typeof CATEGORIES)[number]` = « le type d'un élément du tableau »,
 * puis `["code"]` = « le type de son champ code ».
 */
export type Categorie = (typeof CATEGORIES)[number]["code"];

/** Une demande a 1 à 2 catégories ; la première est la principale (icône affichée). */
export const NB_MAX_CATEGORIES = 2;

/** Les codes seuls, pratiques pour les validations. */
export const CODES_CATEGORIES: readonly Categorie[] = CATEGORIES.map((c) => c.code);

/**
 * Vérifie qu'une chaîne venue de l'extérieur (Firestore, paramètre de route…)
 * est bien une catégorie connue.
 * `valeur is Categorie` est un « type guard » : après un `if (estCategorie(x))`,
 * TypeScript SAIT que x est une Categorie.
 */
export function estCategorie(valeur: string): valeur is Categorie {
  return (CODES_CATEGORIES as readonly string[]).includes(valeur);
}

/** Libellé + emoji d'une catégorie, pour l'affichage. */
export function infosCategorie(code: Categorie) {
  const info = CATEGORIES.find((c) => c.code === code);
  // Impossible en théorie (code est typé), mais `find` peut renvoyer undefined :
  // on échoue bruyamment plutôt que d'afficher une case vide.
  if (!info) throw new Error(`Catégorie inconnue : ${code}`);
  return info;
}