'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calculerNet } from '../lib/calculs';

const fmt = new Intl.NumberFormat('fr-FR');

export default function CalculateurAutoEntrepreneur() {
  const [tjm, setTjm] = useState(300);
  const [joursAnnuels, setJoursAnnuels] = useState(180);
  const [joursMensuels, setJoursMensuels] = useState(15);
  const [joursParMois, setJoursParMois] = useState(false);
  const [modeRepos, setModeRepos] = useState(false);
  const [joursReposAnnuels, setJoursReposAnnuels] = useState(81);
  const [joursReposMensuels, setJoursReposMensuels] = useState(7);
  const JOURS_OUVRABLES_AN = 261;
  const JOURS_OUVRABLES_MOIS = 22;
  const [useCA, setUseCA] = useState(false);
  const [caMensuel, setCAMensuel] = useState(4500);
  const [versementLiberatoire, setVersementLiberatoire] = useState(true);
  const [avecACRE, setAvecACRE] = useState(false);
  const [moisACRE, setMoisACRE] = useState(10);

  const [mutuelle, setMutuelle] = useState(55);
  const [prevoyance, setPrevoyance] = useState(70);
  const [rcPro, setRcPro] = useState(200);
  const [cfe, setCFE] = useState(350);
  const [fraisPros, setFraisPros] = useState(200);

  const [fraisCustom, setFraisCustom] = useState([]);
  const [newFraisNom, setNewFraisNom] = useState('');
  const [newFraisMontant, setNewFraisMontant] = useState('');

  const chargesParams = { versementLiberatoire, avecACRE, moisACRE, cfe, mutuelle, prevoyance, rcPro, fraisPros, fraisCustom };

  const joursCalcules = useMemo(() => {
    if (modeRepos) {
      return joursParMois
        ? Math.max(0, JOURS_OUVRABLES_MOIS - (joursReposMensuels || 0)) * 12
        : Math.max(0, JOURS_OUVRABLES_AN - (joursReposAnnuels || 0));
    }
    return joursParMois ? (joursMensuels || 0) * 12 : (joursAnnuels || 0);
  }, [joursParMois, modeRepos, joursAnnuels, joursMensuels, joursReposAnnuels, joursReposMensuels]);

  const calculs = useMemo(() => {
    const caAnnuel = useCA ? (caMensuel || 0) * 12 : (tjm || 0) * joursCalcules;
    const result = calculerNet({ caAnnuel, ...chargesParams });

    return {
      ...result,
      caAnnuel,
      caMensuel: caAnnuel / 12,
      cfe: cfe || 0,
      rcPro: rcPro || 0,
      fraisProsAnnuels: (fraisPros || 0) * 12,
      fraisCustomAnnuels: (fraisCustom || []).reduce((sum, f) => sum + ((f.montant || 0) * 12), 0),
      joursNonPayes: useCA ? 0 : (JOURS_OUVRABLES_AN - joursCalcules),
      joursCalcules,
    };
  }, [tjm, joursCalcules, useCA, caMensuel, versementLiberatoire, avecACRE, moisACRE, mutuelle, prevoyance, rcPro, cfe, fraisPros, fraisCustom]);

  const scenarios = useMemo(() => {
    if (useCA) {
      const caActuel = (caMensuel || 0) * 12;
      return [-40, -20, 0, 20, 40].map(variation => {
        const ca = caActuel * (1 + variation / 100);
        const result = calculerNet({ caAnnuel: ca, ...chargesParams });
        return {
          label: variation === 0 ? 'Actuel' : `${variation > 0 ? '+' : ''}${variation}%`,
          jours: null,
          ca,
          caMensuel: ca / 12,
          net: result.netFinal,
          netMensuel: result.netMensuel,
          charges: result.totalCharges + result.totalFrais,
          joursOff: null,
        };
      });
    }

    const baseJours = Math.round(joursCalcules / 20) * 20;
    const joursScenarios = [
      Math.max(20, baseJours - 40),
      Math.max(20, baseJours - 20),
      joursCalcules,
      Math.min(JOURS_OUVRABLES_AN, baseJours + 20),
      Math.min(JOURS_OUVRABLES_AN, baseJours + 40),
    ];

    return joursScenarios.map(jours => {
      const ca = (tjm || 0) * jours;
      const result = calculerNet({ caAnnuel: ca, ...chargesParams });
      return {
        label: `${jours}j`,
        jours,
        ca,
        caMensuel: ca / 12,
        net: result.netFinal,
        netMensuel: result.netMensuel,
        charges: result.totalCharges + result.totalFrais,
        joursOff: JOURS_OUVRABLES_AN - jours,
      };
    });
  }, [tjm, joursCalcules, useCA, caMensuel, versementLiberatoire, avecACRE, moisACRE, mutuelle, prevoyance, rcPro, cfe, fraisPros, fraisCustom]);

  const pieData = [
    { name: 'Cotisations sociales', value: calculs.cotisations, color: '#8b5cf6' },
    { name: 'Impôts', value: calculs.impots, color: '#a78bfa' },
    { name: 'Mutuelle', value: calculs.mutuelleAnnuelle, color: '#c4b5fd' },
    { name: 'Prévoyance', value: calculs.prevoyanceAnnuelle, color: '#ddd6fe' },
    { name: 'RC Pro', value: calculs.rcPro, color: '#e9d5ff' },
    { name: 'CFE', value: calculs.cfe, color: '#f3e8ff' },
    { name: 'Frais pros', value: calculs.totalFrais, color: '#faf5ff' },
    { name: 'Net final', value: calculs.netFinal, color: '#10b981' },
  ];

  const ajouterFrais = () => {
    if (newFraisNom && newFraisMontant) {
      setFraisCustom([...fraisCustom, {
        id: Date.now(),
        nom: newFraisNom,
        montant: parseFloat(newFraisMontant),
      }]);
      setNewFraisNom('');
      setNewFraisMontant('');
    }
  };

  const supprimerFrais = (id) => {
    setFraisCustom(fraisCustom.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
            Calculateur Auto-Entrepreneur
          </h1>
          <p className="text-slate-600 text-lg">Simule ton revenu net en temps r&eacute;el</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de configuration */}
          <section className="lg:col-span-1 space-y-5" aria-label="Configuration">
            {/* Mode de calcul */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-6 border border-violet-100 card-hover">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Mode de calcul</h2>

              <div className="flex gap-2 mb-5" role="group" aria-label="Mode de saisie du chiffre d'affaires">
                <button
                  onClick={() => setUseCA(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                    !useCA
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  }`}
                >
                  TJM + Jours
                </button>
                <button
                  onClick={() => setUseCA(true)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all ${
                    useCA
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  }`}
                >
                  CA mensuel
                </button>
              </div>

              {!useCA ? (
                <>
                  <label htmlFor="tjm" className="block text-sm font-semibold text-slate-700 mb-2">
                    TJM (Taux Journalier Moyen)
                  </label>
                  <div className="flex items-center gap-3 mb-5">
                    <input
                      id="tjm"
                      type="number"
                      value={tjm}
                      onChange={(e) => setTjm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="flex-1 px-4 py-3 border-2 border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                    <span className="text-violet-700 font-bold text-lg" aria-hidden="true">&euro;</span>
                  </div>

                  {/* Mode : Travaill&eacute;s / Repos */}
                  <div className="flex gap-2 mb-4" role="group" aria-label="Mode de saisie des jours">
                    <button
                      onClick={() => setModeRepos(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        !modeRepos
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Jours travaill&eacute;s
                    </button>
                    <button
                      onClick={() => setModeRepos(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        modeRepos
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Jours de repos
                    </button>
                  </div>

                  {/* P&eacute;riode : An / Mois */}
                  <div className="flex gap-2 mb-4" role="group" aria-label="P&eacute;riode">
                    <button
                      onClick={() => setJoursParMois(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        !joursParMois
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Par an
                    </button>
                    <button
                      onClick={() => setJoursParMois(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        joursParMois
                          ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Par mois
                    </button>
                  </div>

                  {!modeRepos ? (
                    /* Mode jours travaill&eacute;s */
                    !joursParMois ? (
                      <>
                        <label htmlFor="jours-annuels" className="block text-sm font-semibold text-slate-700 mb-2">
                          Jours travaill&eacute;s par an
                        </label>
                        <input
                          id="jours-annuels"
                          type="number"
                          value={joursAnnuels}
                          onChange={(e) => setJoursAnnuels(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-3 transition-all"
                        />
                        <input
                          type="range"
                          min="20"
                          max={JOURS_OUVRABLES_AN}
                          value={joursAnnuels || 0}
                          onChange={(e) => setJoursAnnuels(parseInt(e.target.value))}
                          aria-label="Jours travaill&eacute;s par an"
                          className="w-full mb-2"
                          style={{
                            background: `linear-gradient(90deg, #8b5cf6 0%, #8b5cf6 ${(((joursAnnuels || 0) - 20) / (JOURS_OUVRABLES_AN - 20)) * 100}%, #e9d5ff ${(((joursAnnuels || 0) - 20) / (JOURS_OUVRABLES_AN - 20)) * 100}%, #e9d5ff 100%)`
                          }}
                        />
                        <div className="text-xs text-violet-600 font-medium">&asymp; {(joursAnnuels / 12).toFixed(1)} jours/mois &bull; {JOURS_OUVRABLES_AN - (joursAnnuels || 0)} jours de repos (hors WE)</div>
                      </>
                    ) : (
                      <>
                        <label htmlFor="jours-mensuels" className="block text-sm font-semibold text-slate-700 mb-2">
                          Jours travaill&eacute;s par mois
                        </label>
                        <input
                          id="jours-mensuels"
                          type="number"
                          value={joursMensuels}
                          onChange={(e) => setJoursMensuels(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-3 transition-all"
                        />
                        <input
                          type="range"
                          min="1"
                          max={JOURS_OUVRABLES_MOIS}
                          value={joursMensuels || 0}
                          onChange={(e) => setJoursMensuels(parseInt(e.target.value))}
                          aria-label="Jours travaill&eacute;s par mois"
                          className="w-full mb-2"
                          style={{
                            background: `linear-gradient(90deg, #8b5cf6 0%, #8b5cf6 ${(((joursMensuels || 0) - 1) / (JOURS_OUVRABLES_MOIS - 1)) * 100}%, #e9d5ff ${(((joursMensuels || 0) - 1) / (JOURS_OUVRABLES_MOIS - 1)) * 100}%, #e9d5ff 100%)`
                          }}
                        />
                        <div className="text-xs text-violet-600 font-medium">= {(joursMensuels || 0) * 12} jours/an &bull; {JOURS_OUVRABLES_MOIS - (joursMensuels || 0)} jours de repos/mois (hors WE)</div>
                      </>
                    )
                  ) : (
                    /* Mode jours de repos */
                    !joursParMois ? (
                      <>
                        <label htmlFor="jours-repos-annuels" className="block text-sm font-semibold text-slate-700 mb-2">
                          Jours de repos par an
                        </label>
                        <input
                          id="jours-repos-annuels"
                          type="number"
                          value={joursReposAnnuels}
                          onChange={(e) => setJoursReposAnnuels(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-3 transition-all"
                        />
                        <input
                          type="range"
                          min="0"
                          max={JOURS_OUVRABLES_AN}
                          value={joursReposAnnuels || 0}
                          onChange={(e) => setJoursReposAnnuels(parseInt(e.target.value))}
                          aria-label="Jours de repos par an"
                          className="w-full mb-2"
                          style={{
                            background: `linear-gradient(90deg, #8b5cf6 0%, #8b5cf6 ${((joursReposAnnuels || 0) / JOURS_OUVRABLES_AN) * 100}%, #e9d5ff ${((joursReposAnnuels || 0) / JOURS_OUVRABLES_AN) * 100}%, #e9d5ff 100%)`
                          }}
                        />
                        <div className="text-xs text-violet-600 font-medium">= {Math.max(0, JOURS_OUVRABLES_AN - (joursReposAnnuels || 0))} jours travaill&eacute;s &bull; &asymp; {((joursReposAnnuels || 0) / 12).toFixed(1)} repos/mois (hors WE)</div>
                      </>
                    ) : (
                      <>
                        <label htmlFor="jours-repos-mensuels" className="block text-sm font-semibold text-slate-700 mb-2">
                          Jours de repos par mois
                        </label>
                        <input
                          id="jours-repos-mensuels"
                          type="number"
                          value={joursReposMensuels}
                          onChange={(e) => setJoursReposMensuels(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-3 transition-all"
                        />
                        <input
                          type="range"
                          min="0"
                          max={JOURS_OUVRABLES_MOIS}
                          value={joursReposMensuels || 0}
                          onChange={(e) => setJoursReposMensuels(parseInt(e.target.value))}
                          aria-label="Jours de repos par mois"
                          className="w-full mb-2"
                          style={{
                            background: `linear-gradient(90deg, #8b5cf6 0%, #8b5cf6 ${((joursReposMensuels || 0) / JOURS_OUVRABLES_MOIS) * 100}%, #e9d5ff ${((joursReposMensuels || 0) / JOURS_OUVRABLES_MOIS) * 100}%, #e9d5ff 100%)`
                          }}
                        />
                        <div className="text-xs text-violet-600 font-medium">= {Math.max(0, JOURS_OUVRABLES_MOIS - (joursReposMensuels || 0))} jours travaill&eacute;s/mois &bull; {Math.max(0, JOURS_OUVRABLES_MOIS - (joursReposMensuels || 0)) * 12} jours/an (hors WE)</div>
                      </>
                    )
                  )}
                </>
              ) : (
                <>
                  <label htmlFor="ca-mensuel" className="block text-sm font-semibold text-slate-700 mb-2">
                    CA mensuel
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="ca-mensuel"
                      type="number"
                      value={caMensuel}
                      onChange={(e) => setCAMensuel(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="flex-1 px-4 py-3 border-2 border-violet-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                    <span className="text-violet-700 font-bold text-lg" aria-hidden="true">&euro;</span>
                  </div>
                </>
              )}
            </div>

            {/* Options fiscales */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-6 border border-violet-100 card-hover">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Options fiscales</h2>

              <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={versementLiberatoire}
                  onChange={(e) => setVersementLiberatoire(e.target.checked)}
                />
                <span className="text-slate-700 font-medium group-hover:text-violet-700 transition-colors">
                  Versement lib&eacute;ratoire (2,2%)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={avecACRE}
                  onChange={(e) => setAvecACRE(e.target.checked)}
                />
                <span className="text-slate-700 font-medium group-hover:text-violet-700 transition-colors">
                  ACRE
                </span>
              </label>

              {avecACRE && (
                <div className="mt-4 ml-8 p-4 bg-violet-50 rounded-xl">
                  <label htmlFor="mois-acre" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nombre de mois avec ACRE
                  </label>
                  <input
                    id="mois-acre"
                    type="number"
                    min="1"
                    max="12"
                    value={moisACRE}
                    onChange={(e) => setMoisACRE(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>

            {/* Charges fixes */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-6 border border-violet-100 card-hover">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Charges</h2>

              <div className="space-y-4">
                {[
                  { id: 'mutuelle', label: 'Mutuelle', unit: '/mois', value: mutuelle, setter: setMutuelle },
                  { id: 'prevoyance', label: 'Pr\u00e9voyance', unit: '/mois', value: prevoyance, setter: setPrevoyance },
                  { id: 'rc-pro', label: 'RC Pro', unit: '/an', value: rcPro, setter: setRcPro },
                  { id: 'cfe', label: 'CFE', unit: '/an', value: cfe, setter: setCFE },
                  { id: 'frais-pros', label: 'Frais pros', unit: '/mois', value: fraisPros, setter: setFraisPros },
                ].map(({ id, label, unit, value, setter }) => (
                  <div key={id}>
                    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-2">
                      {label} <span className="text-violet-500 font-normal">&euro;{unit}</span>
                    </label>
                    <input
                      id={id}
                      type="number"
                      value={value}
                      onChange={(e) => setter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-violet-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Frais personnalis&eacute;s */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-6 border border-violet-100 card-hover">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Frais suppl&eacute;mentaires</h2>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nom"
                  value={newFraisNom}
                  onChange={(e) => setNewFraisNom(e.target.value)}
                  aria-label="Nom du frais"
                  className="flex-1 min-w-0 px-3 py-2 border-2 border-violet-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="&euro;/mois"
                    value={newFraisMontant}
                    onChange={(e) => setNewFraisMontant(e.target.value)}
                    aria-label="Montant mensuel du frais"
                    className="flex-1 sm:w-24 sm:flex-none px-3 py-2 border-2 border-violet-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={ajouterFrais}
                    aria-label="Ajouter un frais"
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-violet-200 transition-all shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              {fraisCustom.length > 0 && (
                <div className="space-y-2">
                  {fraisCustom.map(frais => (
                    <div key={frais.id} className="flex items-center justify-between gap-2 bg-violet-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-slate-700 font-medium truncate">{frais.nom}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-violet-700 whitespace-nowrap">{frais.montant}&euro;/mois</span>
                        <button
                          onClick={() => supprimerFrais(frais.id)}
                          aria-label={`Supprimer ${frais.nom}`}
                          className="text-red-500 hover:text-red-700 font-bold transition-colors"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* R&eacute;sultats et graphiques */}
          <section className="lg:col-span-2 space-y-6" aria-label="R&eacute;sultats">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'CA annuel', value: calculs.caAnnuel, sub: calculs.caMensuel, color: 'violet' },
                { label: 'Charges', value: calculs.totalCharges, sub: calculs.totalCharges / 12, color: 'red' },
                { label: 'Net final', value: calculs.netFinal, sub: calculs.netMensuel, color: 'green' },
                { label: 'Taux charges', value: ((calculs.totalCharges / calculs.caAnnuel) * 100).toFixed(1) + '%', sub: 'du CA', color: 'purple', noFormat: true }
              ].map(({ label, value, sub, color, noFormat }) => (
                <div key={label} className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-5 border border-violet-100 card-hover">
                  <div className="text-sm font-semibold text-slate-600 mb-2">{label}</div>
                  <div className={`text-2xl font-bold ${
                    color === 'violet' ? 'text-violet-600' :
                    color === 'red' ? 'text-red-600' :
                    color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`}>
                    {noFormat ? value : `${Math.round(value).toLocaleString('fr-FR')}\u00A0\u20AC`}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    {typeof sub === 'number' ? `${Math.round(sub).toLocaleString('fr-FR')}\u00A0\u20AC/mois` : sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau sc&eacute;narios */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-4 sm:p-6 border border-violet-100">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Sc&eacute;narios comparatifs</h2>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-violet-200">
                      <th className="text-left py-3 px-3 font-bold text-slate-700">{useCA ? 'Variation' : 'Jours/an'}</th>
                      <th className="text-right py-3 px-3 font-bold text-slate-700">CA annuel</th>
                      <th className="text-right py-3 px-3 font-bold text-slate-700">CA mensuel</th>
                      <th className="text-right py-3 px-3 font-bold text-slate-700">Net annuel</th>
                      <th className="text-right py-3 px-3 font-bold text-slate-700">Net mensuel</th>
                      {!useCA && <th className="text-right py-3 px-3 font-bold text-slate-700">Jours off</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, idx) => (
                      <tr key={idx} className="border-b border-violet-100 hover:bg-violet-50/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-violet-700">{s.label}</td>
                        <td className="py-3 px-3 text-right text-slate-700 font-medium">{Math.round(s.ca).toLocaleString('fr-FR')}&euro;</td>
                        <td className="py-3 px-3 text-right text-slate-700 font-medium">{Math.round(s.caMensuel).toLocaleString('fr-FR')}&euro;</td>
                        <td className="py-3 px-3 text-right font-bold text-green-600">{Math.round(s.net).toLocaleString('fr-FR')}&euro;</td>
                        <td className="py-3 px-3 text-right font-bold text-green-700 text-base">{Math.round(s.netMensuel).toLocaleString('fr-FR')}&euro;</td>
                        {!useCA && <td className="py-3 px-3 text-right text-slate-500 font-medium">{s.joursOff}j</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Graphique barres comparatif */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-4 sm:p-6 border border-violet-100">
              <h2 className="text-xl font-bold text-slate-800 mb-5">
                Comparaison des sc&eacute;narios
              </h2>
              <div className="h-[280px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarios} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd6fe" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#8b5cf6"
                    style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13 }}
                  />
                  <YAxis
                    stroke="#8b5cf6"
                    style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k\u20AC`}
                  />
                  <Tooltip
                    formatter={(value) => `${Math.round(value).toLocaleString('fr-FR')}\u20AC`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '2px solid #8b5cf6',
                      borderRadius: '12px',
                      fontFamily: 'DM Sans',
                      fontWeight: 600,
                      padding: '12px'
                    }}
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="ca"
                    name="CA annuel"
                    fill="url(#barGradientCA)"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="charges"
                    name="Charges totales"
                    fill="url(#barGradientCharges)"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="net"
                    name="Net annuel"
                    fill="url(#barGradientNet)"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="barGradientCA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="barGradientCharges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="barGradientNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Camembert */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-4 sm:p-6 border border-violet-100">
              <h2 className="text-xl font-bold text-slate-800 mb-5">R&eacute;partition du CA annuel</h2>
              {/* Desktop: pie + légende côte à côte */}
              <div className="hidden sm:block">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="40%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={110}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${Math.round(value).toLocaleString('fr-FR')}\u20AC`}
                        contentStyle={{
                          fontFamily: 'DM Sans',
                          fontWeight: 600,
                          borderRadius: '12px',
                          border: '2px solid #8b5cf6',
                          padding: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.98)'
                        }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        wrapperStyle={{
                          fontFamily: 'DM Sans',
                          fontWeight: 600,
                          fontSize: 13,
                          paddingLeft: '20px'
                        }}
                        formatter={(value, entry) => {
                          const total = pieData.reduce((sum, item) => sum + item.value, 0);
                          const itemValue = entry.payload?.value || 0;
                          const percent = total > 0 ? ((itemValue / total) * 100).toFixed(1) : '0';
                          return (
                            <span style={{ color: '#1e293b' }}>
                              {value} <span style={{ color: '#64748b', fontSize: 12 }}>({percent}% &bull; {Math.round(itemValue).toLocaleString('fr-FR')}&euro;)</span>
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Mobile: pie au-dessus, légende en dessous */}
              <div className="sm:hidden">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={85}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${Math.round(value).toLocaleString('fr-FR')}\u20AC`}
                        contentStyle={{
                          fontFamily: 'DM Sans',
                          fontWeight: 600,
                          borderRadius: '12px',
                          border: '2px solid #8b5cf6',
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.98)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {pieData.map((item) => {
                    const total = pieData.reduce((sum, i) => sum + i.value, 0);
                    const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 truncate">{item.name}</span>
                        <span className="text-slate-500 shrink-0 ml-auto">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* D&eacute;tail charges */}
            <div className="glass-card rounded-2xl shadow-lg shadow-violet-100/50 p-6 border border-violet-100">
              <h2 className="text-xl font-bold text-slate-800 mb-5">D&eacute;tail des charges annuelles</h2>
              <div className="space-y-3">
                {[
                  { label: `Cotisations sociales ${avecACRE ? '(avec ACRE)' : '(21,2%)'}`, value: calculs.cotisations, color: '#8b5cf6' },
                  { label: `Imp\u00f4ts ${versementLiberatoire ? '(VL 2,2%)' : '(IR)'}`, value: calculs.impots, color: '#a78bfa' },
                  { label: `Mutuelle (${mutuelle}\u20AC/mois)`, value: calculs.mutuelleAnnuelle, color: '#c4b5fd' },
                  { label: `Pr\u00e9voyance (${prevoyance}\u20AC/mois)`, value: calculs.prevoyanceAnnuelle, color: '#ddd6fe' },
                  { label: 'RC Pro', value: calculs.rcPro, color: '#e9d5ff' },
                  { label: 'CFE', value: calculs.cfe, color: '#f3e8ff' },
                  { label: 'Frais professionnels', value: calculs.totalFrais, color: '#faf5ff' }
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-violet-100 hover:bg-violet-50/50 px-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      ></div>
                      <span className="text-slate-700 font-medium">{label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{Math.round(value).toLocaleString('fr-FR')}&euro;</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl px-4 mt-4">
                  <span className="font-bold text-slate-900 text-lg">TOTAL</span>
                  <span className="font-bold text-violet-700 text-xl">{Math.round(calculs.totalCharges + calculs.totalFrais).toLocaleString('fr-FR')}&euro;</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-12 pb-6 text-center">
          <p className="text-sm text-slate-500">
            Cr&eacute;&eacute; par{' '}
            <a
              href="https://elouanb7.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-600 hover:text-violet-800 transition-colors underline underline-offset-2"
            >
              Elouan B.
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
