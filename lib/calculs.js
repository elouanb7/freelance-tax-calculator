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
 * Paramètres par type d'activité auto-entrepreneur.
 * - abattement : abattement forfaitaire sur le CA
 * - tauxVL : taux du versement libératoire
 * - tauxCotis : taux de cotisations sociales
 * - tauxCotisACRE : taux de cotisations sociales avec ACRE
 */
export const ACTIVITES = {
  bnc: {
    label: 'BNC (libéral)',
    abattement: 0.34,
    tauxVL: 0.022,
    tauxCotis: 0.212,
    tauxCotisACRE: 0.106,
  },
  bic_services: {
    label: 'BIC (services)',
    abattement: 0.50,
    tauxVL: 0.017,
    tauxCotis: 0.212,
    tauxCotisACRE: 0.106,
  },
  bic_vente: {
    label: 'BIC (vente)',
    abattement: 0.71,
    tauxVL: 0.01,
    tauxCotis: 0.123,
    tauxCotisACRE: 0.062,
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
 * Calcule les cotisations sociales (avec ou sans ACRE).
 */
export function calculerCotisations(caAnnuel, avecACRE, moisACRE, activite = 'bnc') {
  const params = ACTIVITES[activite];

  if (avecACRE) {
    const moisACRECalc = Math.min(moisACRE || 0, 12);
    const moisNormaux = 12 - moisACRECalc;
    const cotisACRE = (caAnnuel / 12) * moisACRECalc * params.tauxCotisACRE;
    const cotisNormales = (caAnnuel / 12) * moisNormaux * params.tauxCotis;
    return cotisACRE + cotisNormales;
  }
  return caAnnuel * params.tauxCotis;
}

/**
 * Calcule le net final à partir du CA et des paramètres.
 */
export function calculerNet({ caAnnuel, versementLiberatoire, avecACRE, moisACRE, cfe, mutuelle, prevoyance, rcPro, fraisPros, fraisCustom, activite = 'bnc' }) {
  const cotisations = calculerCotisations(caAnnuel, avecACRE, moisACRE, activite);
  const impots = calculerImpots(caAnnuel, versementLiberatoire, activite);

  const mutuelleAnnuelle = (mutuelle || 0) * 12;
  const prevoyanceAnnuelle = (prevoyance || 0) * 12;
  const fraisProsAnnuels = (fraisPros || 0) * 12;
  const fraisCustomAnnuels = (fraisCustom || []).reduce((sum, f) => sum + ((f.montant || 0) * (f.periode === 'an' ? 1 : 12)), 0);

  const totalCharges = cotisations + impots + (cfe || 0) + mutuelleAnnuelle + prevoyanceAnnuelle + (rcPro || 0);
  const totalFrais = fraisProsAnnuels + fraisCustomAnnuels;
  const netAvantFrais = caAnnuel - totalCharges;
  const netFinal = netAvantFrais - totalFrais;

  return {
    cotisations,
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
