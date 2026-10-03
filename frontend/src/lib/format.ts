const nf = new Intl.NumberFormat('fr-FR');

/** Formate un nombre avec les séparateurs français (locale explicite, indépendante du navigateur). */
export const formatNumber = (value: number): string => nf.format(value);

/** Formate un montant virtuel en Ariary, ex. « 425 000 MGA ». */
export const formatMGA = (value: number): string => `${formatNumber(value)} MGA`;
