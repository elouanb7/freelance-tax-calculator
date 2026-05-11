/**
 * Barème IR 2026 (revenus 2025) - célibataire 1 part.
 */
const TRANCHES = [
  { seuil: 11497, taux: 0 },
  { seuil: 29315, taux: 0.11 },
  { seuil: 83823, taux: 0.30 },
  { seuil: 180294, taux: 0.41 },
  { seuil: Infinity, taux: 0.45 },
];

const DECOTE_SEUIL = 1964;
const DECOTE_BASE = 889;
const DECOTE_COEFF = 0.4525;

/**
 * Paramètres par type d'activité auto-entrepreneur (barèmes URSSAF 2026).
 * - abattement : abattement forfaitaire sur le CA
 * - tauxVL : taux du versement libératoire
 * - tauxCotis : taux de cotisations sociales (hors ACRE)
 * - tauxCotisACRE : taux de cotisations sociales pendant l'ACRE
 * - tauxCFP : contribution à la formation professionnelle (non réduite par l'ACRE)
 */
export const ACTIVITES = {
  bnc: {
    label: 'BNC (libéral)',
    abattement: 0.34,
    tauxVL: 0.022,
    tauxCotis: 0.256,
    tauxCotisACRE: 0.128,
    tauxCFP: 0.002,
  },
  bic_services: {
    label: 'BIC (services)',
    abattement: 0.50,
    tauxVL: 0.017,
    tauxCotis: 0.212,
    tauxCotisACRE: 0.106,
    tauxCFP: 0.002,
  },
  bic_vente: {
    label: 'BIC (vente)',
    abattement: 0.71,
    tauxVL: 0.01,
    tauxCotis: 0.123,
    tauxCotisACRE: 0.062,
    tauxCFP: 0.001,
  },
};

function calculerIR(revenuNet) {
  let impot = 0;
  let seuilPrecedent = 0;

  for (const { seuil, taux } of TRANCHES) {
    if (revenuNet <= seuilPrecedent) break;
    const trancheImposable = Math.min(revenuNet, seuil) - seuilPrecedent;
    impot += trancheImposable * taux;
    seuilPrecedent = seuil;
  }

  if (impot > 0 && impot < DECOTE_SEUIL) {
    const decote = Math.max(0, DECOTE_BASE - (impot * DECOTE_COEFF));
    impot = Math.max(0, impot - decote);
  }

  return impot;
}

export function calculerImpots(caAnnuel, versementLiberatoire, activite = 'bnc') {
  const params = ACTIVITES[activite];

  if (versementLiberatoire) {
    return caAnnuel * params.tauxVL;
  }

  const revenuImposable = caAnnuel * (1 - params.abattement);
  return calculerIR(revenuImposable);
}

/**
 * Calcule les cotisations sociales (hors CFP).
 * Par défaut (moisACRE non précisé), l'ACRE s'applique à toute la période.
 * Si moisACRE est précisé, mixe ACRE et taux plein au prorata sur 12 mois.
 */
export function calculerCotisations(caAnnuel, avecACRE, moisACRE, activite = 'bnc') {
  const params = ACTIVITES[activite];

  if (!avecACRE) return caAnnuel * params.tauxCotis;

  if (moisACRE === undefined || moisACRE === null || moisACRE === '' || moisACRE >= 12) {
    return caAnnuel * params.tauxCotisACRE;
  }

  const moisACRECalc = Math.max(0, Math.min(moisACRE, 12));
  const moisNormaux = 12 - moisACRECalc;
  const cotisACRE = (caAnnuel / 12) * moisACRECalc * params.tauxCotisACRE;
  const cotisNormales = (caAnnuel / 12) * moisNormaux * params.tauxCotis;
  return cotisACRE + cotisNormales;
}

/**
 * Calcule la CFP (non réduite par l'ACRE).
 */
export function calculerCFP(caAnnuel, activite = 'bnc') {
  return caAnnuel * ACTIVITES[activite].tauxCFP;
}

/**
 * Calcule le net final à partir du CA et des paramètres.
 */
export function calculerNet({ caAnnuel, versementLiberatoire, avecACRE, moisACRE, cfe, mutuelle, prevoyance, rcPro, fraisPros, fraisCustom, activite = 'bnc' }) {
  const cotisations = calculerCotisations(caAnnuel, avecACRE, moisACRE, activite);
  const cfp = calculerCFP(caAnnuel, activite);
  const impots = calculerImpots(caAnnuel, versementLiberatoire, activite);

  const mutuelleAnnuelle = (mutuelle || 0) * 12;
  const prevoyanceAnnuelle = (prevoyance || 0) * 12;
  const fraisProsAnnuels = (fraisPros || 0) * 12;
  const fraisCustomAnnuels = (fraisCustom || []).reduce((sum, f) => sum + ((f.montant || 0) * (f.periode === 'an' ? 1 : 12)), 0);

  const totalCharges = cotisations + cfp + impots + (cfe || 0) + mutuelleAnnuelle + prevoyanceAnnuelle + (rcPro || 0);
  const totalFrais = fraisProsAnnuels + fraisCustomAnnuels;
  const netAvantFrais = caAnnuel - totalCharges;
  const netFinal = netAvantFrais - totalFrais;

  return {
    cotisations,
    cfp,
    impots,
    mutuelleAnnuelle,
    prevoyanceAnnuelle,
    totalCharges,
    totalFrais,
    netAvantFrais,
    netFinal,
    netMensuel: netFinal / 12,
  };
}
