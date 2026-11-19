/**
 * src/services/erreurs.ts
 *
 * ErreurMetier = une erreur dont le message a été ÉCRIT POUR L'UTILISATRICE
 * (en français, formulé en « quoi faire »). messageErreur() l'affiche telle
 * quelle. Toutes les autres erreurs (réseau, bug…) gardent un message
 * générique : leur texte technique, en anglais, ne doit jamais s'afficher.
 */
export class ErreurMetier extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurMetier";
    // Sécurité : garantit que `instanceof ErreurMetier` fonctionne même si
    // le code est transpilé (héritage d'une classe native comme Error).
    Object.setPrototypeOf(this, ErreurMetier.prototype);
  }
}