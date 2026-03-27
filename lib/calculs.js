/**
 * Calcule les impôts selon le régime choisi (versement libératoire ou IR classique).
 */
export function calculerImpots(caAnnuel, versementLiberatoire) {
  if (versementLiberatoire) {
    return caAnnuel * 0.022;
  }

  const revenuImposable = caAnnuel * 0.66;
  const revenuAbattement10 = revenuImposable * 0.9;

  if (revenuAbattement10 <= 11294) {
    return 0;
  }

  if (revenuAbattement10 <= 28797) {
    const imposable = revenuAbattement10 - 11294;
    let impots = imposable * 0.11;
    if (impots < 1929) {
      const decote = Math.max(0, 873 - (impots * 0.4525));
      impots = Math.max(0, impots - decote);
    }
    return impots;
  }

  const tranche1 = (28797 - 11294) * 0.11;
  const tranche2 = (revenuAbattement10 - 28797) * 0.30;
  return tranche1 + tranche2;
}

/**
 * Calcule les cotisations sociales (avec ou sans ACRE).
 */
export function calculerCotisations(caAnnuel, avecACRE, moisACRE) {
  if (avecACRE) {
    const moisACRECalc = Math.min(moisACRE || 0, 12);
    const moisNormaux = 12 - moisACRECalc;
    const cotisACRE = (caAnnuel / 12) * moisACRECalc * 0.106;
    const cotisNormales = (caAnnuel / 12) * moisNormaux * 0.212;
    return cotisACRE + cotisNormales;
  }
  return caAnnuel * 0.212;
}

/**
 * Calcule le net final à partir du CA et des paramètres.
 */
export function calculerNet({ caAnnuel, versementLiberatoire, avecACRE, moisACRE, cfe, mutuelle, prevoyance, rcPro, fraisPros, fraisCustom }) {
  const cotisations = calculerCotisations(caAnnuel, avecACRE, moisACRE);
  const impots = calculerImpots(caAnnuel, versementLiberatoire);

  const mutuelleAnnuelle = (mutuelle || 0) * 12;
  const prevoyanceAnnuelle = (prevoyance || 0) * 12;
  const fraisProsAnnuels = (fraisPros || 0) * 12;
  const fraisCustomAnnuels = (fraisCustom || []).reduce((sum, f) => sum + ((f.montant || 0) * 12), 0);

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
