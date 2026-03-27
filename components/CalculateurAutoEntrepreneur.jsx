'use client';

import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calculerNet } from '../lib/calculs';

const JOURS_OUVRABLES_AN = 261;
const JOURS_OUVRABLES_MOIS = 22;

// Palette cohérente pour les pie/bar charts
const LIGHT_COLORS = {
  charges: ['#1e3a5f', '#2b4f7a', '#3d6a9e', '#5a8ab8', '#7ba8cc', '#9ec4dd', '#c3dceb'],
  positive: '#1a6b4a',
  negative: '#9b2c2c',
  accent: '#1e3a5f',
  grid: '#d8d3c8',
  tooltipBg: 'rgba(255,254,249,0.98)',
  tooltipBorder: '#1e3a5f',
  barCA: ['#3d6a9e', '#1e3a5f'],
  barCharges: ['#c87a7a', '#9b2c2c'],
  barNet: ['#3daa75', '#1a6b4a'],
};
const DARK_COLORS = {
  charges: ['#60a5fa', '#4b8fe0', '#3b7cc8', '#6bb5ff', '#93c5fd', '#b0d4fd', '#d0e6fe'],
  positive: '#4ade80',
  negative: '#fca5a5',
  accent: '#60a5fa',
  grid: '#2e2e2e',
  tooltipBg: 'rgba(31,31,31,0.98)',
  tooltipBorder: '#60a5fa',
  barCA: ['#93c5fd', '#60a5fa'],
  barCharges: ['#fca5a5', '#f87171'],
  barNet: ['#86efac', '#4ade80'],
};

function ThemeToggle({ dark, setDark }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="p-2.5 rounded-xl transition-all card-hover cursor-pointer"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all text-sm cursor-pointer"
      style={active
        ? { background: 'var(--accent)', color: 'white', boxShadow: `0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent)` }
        : { background: 'var(--accent-light)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 1px var(--card-border)' }
      }
    >
      {children}
    </button>
  );
}

function SmallToggle({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer"
      style={active
        ? { background: 'var(--accent-light)', color: 'var(--accent)', boxShadow: 'inset 0 0 0 2px var(--accent)' }
        : { background: 'var(--card-bg)', color: 'var(--subtitle)', boxShadow: 'inset 0 0 0 1px var(--card-border)' }
      }
    >
      {children}
    </button>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`theme-card rounded-2xl p-6 card-hover ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--title)' }}>{children}</h2>;
}

function Label({ htmlFor, children }) {
  return <label htmlFor={htmlFor} className="block text-sm font-semibold mb-2" style={{ color: 'var(--subtitle)' }}>{children}</label>;
}

function NumberInput({ id, value, onChange, className = '' }) {
  return (
    <input
      id={id}
      type="number"
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 ${className}`}
      style={{
        background: 'var(--input-bg)',
        border: '2px solid var(--input-border)',
        color: 'var(--title)',
        '--tw-ring-color': 'var(--accent)',
      }}
    />
  );
}

function SmallInput({ id, value, onChange, type = 'number', placeholder, className = '' }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${className}`}
      style={{
        background: 'var(--input-bg)',
        border: '2px solid var(--input-border)',
        color: 'var(--title)',
        '--tw-ring-color': 'var(--accent)',
      }}
    />
  );
}

function Copyable({ value, children, className = '' }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    const text = String(value).replace(/\s/g, '').replace('€', '');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <span onClick={handleClick} className={`cursor-pointer relative select-none ${className}`} title="Cliquer pour copier">
      {children}
      {copied && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap" style={{ background: 'var(--accent)', color: 'white' }}>
          Copi&eacute;
        </span>
      )}
    </span>
  );
}

function RangeSlider({ min, max, value, onChange, ariaLabel }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className="w-full mb-2"
      style={{
        background: `linear-gradient(90deg, var(--accent) 0%, var(--accent) ${pct}%, var(--range-track) ${pct}%, var(--range-track) 100%)`
      }}
    />
  );
}

export default function CalculateurAutoEntrepreneur() {
  const [dark, setDark] = useState(false);
  const [tjm, setTjm] = useState(300);
  const [joursAnnuels, setJoursAnnuels] = useState(180);
  const [joursMensuels, setJoursMensuels] = useState(15);
  const [joursParMois, setJoursParMois] = useState(false);
  const [modeRepos, setModeRepos] = useState(false);
  const [joursReposAnnuels, setJoursReposAnnuels] = useState(81);
  const [joursReposMensuels, setJoursReposMensuels] = useState(7);
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
  const [newFraisPeriode, setNewFraisPeriode] = useState('mois');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
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
      fraisCustomAnnuels: (fraisCustom || []).reduce((sum, f) => sum + ((f.montant || 0) * (f.periode === 'an' ? 1 : 12)), 0),
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
          ca, caMensuel: ca / 12, net: result.netFinal, netMensuel: result.netMensuel,
          charges: result.totalCharges + result.totalFrais, joursOff: null,
        };
      });
    }
    const baseJours = Math.round(joursCalcules / 20) * 20;
    return [
      Math.max(20, baseJours - 40), Math.max(20, baseJours - 20), joursCalcules,
      Math.min(JOURS_OUVRABLES_AN, baseJours + 20), Math.min(JOURS_OUVRABLES_AN, baseJours + 40),
    ].map(jours => {
      const ca = (tjm || 0) * jours;
      const result = calculerNet({ caAnnuel: ca, ...chargesParams });
      return {
        label: `${jours}j`, jours, ca, caMensuel: ca / 12, net: result.netFinal,
        netMensuel: result.netMensuel, charges: result.totalCharges + result.totalFrais,
        joursOff: JOURS_OUVRABLES_AN - jours,
      };
    });
  }, [tjm, joursCalcules, useCA, caMensuel, versementLiberatoire, avecACRE, moisACRE, mutuelle, prevoyance, rcPro, cfe, fraisPros, fraisCustom]);

  const pieData = [
    { name: 'Cotisations sociales', value: calculs.cotisations, color: colors.charges[0] },
    { name: 'Imp\u00f4ts', value: calculs.impots, color: colors.charges[1] },
    { name: 'Mutuelle', value: calculs.mutuelleAnnuelle, color: colors.charges[2] },
    { name: 'Pr\u00e9voyance', value: calculs.prevoyanceAnnuelle, color: colors.charges[3] },
    { name: 'RC Pro', value: calculs.rcPro, color: colors.charges[4] },
    { name: 'CFE', value: calculs.cfe, color: colors.charges[5] },
    { name: 'Frais pros', value: calculs.totalFrais, color: colors.charges[6] },
    { name: 'Net final', value: calculs.netFinal, color: colors.positive },
  ];

  const detailCharges = [
    { label: `Cotisations sociales ${avecACRE ? '(avec ACRE)' : '(21,2%)'}`, value: calculs.cotisations, color: colors.charges[0] },
    { label: `Imp\u00f4ts ${versementLiberatoire ? '(VL 2,2%)' : '(IR)'}`, value: calculs.impots, color: colors.charges[1] },
    { label: `Mutuelle (${mutuelle}\u20AC/mois)`, value: calculs.mutuelleAnnuelle, color: colors.charges[2] },
    { label: `Pr\u00e9voyance (${prevoyance}\u20AC/mois)`, value: calculs.prevoyanceAnnuelle, color: colors.charges[3] },
    { label: 'RC Pro', value: calculs.rcPro, color: colors.charges[4] },
    { label: 'CFE', value: calculs.cfe, color: colors.charges[5] },
    { label: 'Frais professionnels', value: calculs.totalFrais, color: colors.charges[6] },
  ];

  const ajouterFrais = () => {
    if (newFraisNom && newFraisMontant) {
      setFraisCustom([...fraisCustom, { id: Date.now(), nom: newFraisNom, montant: parseFloat(newFraisMontant), periode: newFraisPeriode }]);
      setNewFraisNom('');
      setNewFraisMontant('');
      setNewFraisPeriode('mois');
    }
  };

  const supprimerFrais = (id) => setFraisCustom(fraisCustom.filter(f => f.id !== id));

  const fmt = (v) => Math.round(v).toLocaleString('fr-FR');

  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `2px solid ${colors.tooltipBorder}`,
    borderRadius: '12px',
    fontFamily: 'DM Sans',
    fontWeight: 600,
    padding: '12px',
  };
  const tooltipTextStyle = { color: dark ? '#ececec' : '#111' };

  const kpis = [
    { label: 'CA annuel', value: calculs.caAnnuel, sub: calculs.caMensuel, color: 'var(--accent)' },
    { label: 'Charges', value: calculs.totalCharges, sub: calculs.totalCharges / 12, color: 'var(--kpi-negative)' },
    { label: 'Net final', value: calculs.netFinal, sub: calculs.netMensuel, color: 'var(--kpi-positive)' },
    { label: 'Taux charges', value: ((calculs.totalCharges / calculs.caAnnuel) * 100).toFixed(1) + '%', sub: 'du CA', color: 'var(--subtitle)', noFormat: true },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--title)' }}>
              Calculateur Auto-Entrepreneur
            </h1>
            <p className="text-lg" style={{ color: 'var(--subtitle)' }}>Simule ton revenu net en temps r&eacute;el</p>
          </div>
          <ThemeToggle dark={dark} setDark={setDark} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ PANEL CONFIGURATION ═══ */}
          <section className="lg:col-span-1 space-y-5" aria-label="Configuration">

            {/* Mode de calcul */}
            <Card>
              <CardTitle>Mode de calcul</CardTitle>
              <div className="flex gap-2 mb-5" role="group">
                <ToggleButton active={!useCA} onClick={() => setUseCA(false)}>TJM + Jours</ToggleButton>
                <ToggleButton active={useCA} onClick={() => setUseCA(true)}>CA mensuel</ToggleButton>
              </div>

              {!useCA ? (
                <>
                  <Label htmlFor="tjm">TJM (Taux Journalier Moyen)</Label>
                  <div className="flex items-center gap-3 mb-5">
                    <NumberInput id="tjm" value={tjm} onChange={(e) => setTjm(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>&euro;</span>
                  </div>

                  <div className="flex gap-2 mb-4" role="group">
                    <SmallToggle active={!modeRepos} onClick={() => setModeRepos(false)}>Jours travaill&eacute;s</SmallToggle>
                    <SmallToggle active={modeRepos} onClick={() => setModeRepos(true)}>Jours de repos</SmallToggle>
                  </div>

                  <div className="flex gap-2 mb-4" role="group">
                    <SmallToggle active={!joursParMois} onClick={() => setJoursParMois(false)}>Par an</SmallToggle>
                    <SmallToggle active={joursParMois} onClick={() => setJoursParMois(true)}>Par mois</SmallToggle>
                  </div>

                  {!modeRepos ? (
                    !joursParMois ? (
                      <>
                        <Label htmlFor="jours-annuels">Jours travaill&eacute;s par an</Label>
                        <NumberInput id="jours-annuels" value={joursAnnuels} onChange={(e) => setJoursAnnuels(e.target.value === '' ? '' : parseInt(e.target.value))} className="mb-3" />
                        <RangeSlider min={20} max={JOURS_OUVRABLES_AN} value={joursAnnuels || 0} onChange={(e) => setJoursAnnuels(parseInt(e.target.value))} ariaLabel="Jours travaill\u00e9s par an" />
                        <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>&asymp; {(joursAnnuels / 12).toFixed(1)} jours/mois &bull; {JOURS_OUVRABLES_AN - (joursAnnuels || 0)} jours de repos (hors WE)</div>
                      </>
                    ) : (
                      <>
                        <Label htmlFor="jours-mensuels">Jours travaill&eacute;s par mois</Label>
                        <NumberInput id="jours-mensuels" value={joursMensuels} onChange={(e) => setJoursMensuels(e.target.value === '' ? '' : parseInt(e.target.value))} className="mb-3" />
                        <RangeSlider min={1} max={JOURS_OUVRABLES_MOIS} value={joursMensuels || 0} onChange={(e) => setJoursMensuels(parseInt(e.target.value))} ariaLabel="Jours travaill\u00e9s par mois" />
                        <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>= {(joursMensuels || 0) * 12} jours/an &bull; {JOURS_OUVRABLES_MOIS - (joursMensuels || 0)} jours de repos/mois (hors WE)</div>
                      </>
                    )
                  ) : (
                    !joursParMois ? (
                      <>
                        <Label htmlFor="jours-repos-annuels">Jours de repos par an</Label>
                        <NumberInput id="jours-repos-annuels" value={joursReposAnnuels} onChange={(e) => setJoursReposAnnuels(e.target.value === '' ? '' : parseInt(e.target.value))} className="mb-3" />
                        <RangeSlider min={0} max={JOURS_OUVRABLES_AN} value={joursReposAnnuels || 0} onChange={(e) => setJoursReposAnnuels(parseInt(e.target.value))} ariaLabel="Jours de repos par an" />
                        <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>= {Math.max(0, JOURS_OUVRABLES_AN - (joursReposAnnuels || 0))} jours travaill&eacute;s &bull; &asymp; {((joursReposAnnuels || 0) / 12).toFixed(1)} repos/mois (hors WE)</div>
                      </>
                    ) : (
                      <>
                        <Label htmlFor="jours-repos-mensuels">Jours de repos par mois</Label>
                        <NumberInput id="jours-repos-mensuels" value={joursReposMensuels} onChange={(e) => setJoursReposMensuels(e.target.value === '' ? '' : parseInt(e.target.value))} className="mb-3" />
                        <RangeSlider min={0} max={JOURS_OUVRABLES_MOIS} value={joursReposMensuels || 0} onChange={(e) => setJoursReposMensuels(parseInt(e.target.value))} ariaLabel="Jours de repos par mois" />
                        <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>= {Math.max(0, JOURS_OUVRABLES_MOIS - (joursReposMensuels || 0))} jours travaill&eacute;s/mois &bull; {Math.max(0, JOURS_OUVRABLES_MOIS - (joursReposMensuels || 0)) * 12} jours/an (hors WE)</div>
                      </>
                    )
                  )}
                </>
              ) : (
                <>
                  <Label htmlFor="ca-mensuel">CA mensuel</Label>
                  <div className="flex items-center gap-3">
                    <NumberInput id="ca-mensuel" value={caMensuel} onChange={(e) => setCAMensuel(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>&euro;</span>
                  </div>
                </>
              )}
            </Card>

            {/* Options fiscales */}
            <Card>
              <CardTitle>Options fiscales</CardTitle>
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input type="checkbox" checked={versementLiberatoire} onChange={(e) => setVersementLiberatoire(e.target.checked)} />
                <span className="font-medium" style={{ color: 'var(--title)' }}>Versement lib&eacute;ratoire (2,2%)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={avecACRE} onChange={(e) => setAvecACRE(e.target.checked)} />
                <span className="font-medium" style={{ color: 'var(--title)' }}>ACRE</span>
              </label>
              {avecACRE && (
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--accent-light)' }}>
                  <Label htmlFor="mois-acre">Nombre de mois avec ACRE</Label>
                  <SmallInput id="mois-acre" value={moisACRE} onChange={(e) => setMoisACRE(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full" />
                </div>
              )}
            </Card>

            {/* Charges */}
            <Card>
              <CardTitle>Charges</CardTitle>
              <div className="space-y-4">
                {[
                  { id: 'mutuelle', label: 'Mutuelle', unit: '/mois', value: mutuelle, setter: setMutuelle },
                  { id: 'prevoyance', label: 'Pr\u00e9voyance', unit: '/mois', value: prevoyance, setter: setPrevoyance },
                  { id: 'rc-pro', label: 'RC Pro', unit: '/an', value: rcPro, setter: setRcPro },
                  { id: 'cfe', label: 'CFE', unit: '/an', value: cfe, setter: setCFE },
                  { id: 'frais-pros', label: 'Frais pros', unit: '/mois', value: fraisPros, setter: setFraisPros },
                ].map(({ id, label, unit, value, setter }) => (
                  <div key={id}>
                    <Label htmlFor={id}>{label} <span style={{ color: 'var(--accent)', fontWeight: 400 }}>&euro;{unit}</span></Label>
                    <SmallInput id={id} value={value} onChange={(e) => setter(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Frais suppl\u00e9mentaires */}
            <Card>
              <CardTitle>Frais suppl&eacute;mentaires</CardTitle>
              <div className="flex gap-2 mb-3">
                <SmallToggle active={newFraisPeriode === 'mois'} onClick={() => setNewFraisPeriode('mois')}>Par mois</SmallToggle>
                <SmallToggle active={newFraisPeriode === 'an'} onClick={() => setNewFraisPeriode('an')}>Par an</SmallToggle>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <SmallInput type="text" placeholder="Nom" value={newFraisNom} onChange={(e) => setNewFraisNom(e.target.value)} className="flex-1 min-w-0" />
                <div className="flex gap-2">
                  <SmallInput placeholder={`\u20AC/${newFraisPeriode}`} value={newFraisMontant} onChange={(e) => setNewFraisMontant(e.target.value)} className="flex-1 sm:w-24 sm:flex-none" />
                  <button
                    onClick={ajouterFrais}
                    aria-label="Ajouter un frais"
                    className="px-4 py-2 rounded-lg font-bold transition-all shrink-0 cursor-pointer"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    +
                  </button>
                </div>
              </div>
              {fraisCustom.length > 0 && (
                <div className="space-y-2">
                  {fraisCustom.map(frais => (
                    <div key={frais.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--accent-light)' }}>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--title)' }}>{frais.nom}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--accent)' }}>{frais.montant}&euro;/{frais.periode || 'mois'}</span>
                        <button onClick={() => supprimerFrais(frais.id)} aria-label={`Supprimer ${frais.nom}`} style={{ color: 'var(--kpi-negative)' }} className="font-bold text-xl leading-none cursor-pointer p-1">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* ═══ R\u00c9SULTATS ═══ */}
          <section className="lg:col-span-2 space-y-6" aria-label="R\u00e9sultats">

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map(({ label, value, sub, color, noFormat }) => (
                <Copyable key={label} value={noFormat ? value : Math.round(value)}>
                  <div className="theme-card rounded-2xl p-5 card-hover">
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--subtitle)' }}>{label}</div>
                    <div className="text-2xl font-bold" style={{ color }}>
                      {noFormat ? value : `${fmt(value)}\u00A0\u20AC`}
                    </div>
                    <div className="text-xs mt-1 font-medium" style={{ color: 'var(--subtitle)' }}>
                      {typeof sub === 'number' ? `${fmt(sub)}\u00A0\u20AC/mois` : sub}
                    </div>
                  </div>
                </Copyable>
              ))}
            </div>

            {/* Tableau sc\u00e9narios */}
            <Card className="p-4 sm:p-6">
              <CardTitle>Sc&eacute;narios comparatifs</CardTitle>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `2px solid var(--card-border)` }}>
                      <th className="text-left py-3 px-3 font-bold" style={{ color: 'var(--subtitle)' }}>{useCA ? 'Variation' : 'Jours/an'}</th>
                      <th className="text-right py-3 px-3 font-bold" style={{ color: 'var(--subtitle)' }}>CA annuel</th>
                      <th className="text-right py-3 px-3 font-bold" style={{ color: 'var(--subtitle)' }}>CA mensuel</th>
                      <th className="text-right py-3 px-3 font-bold" style={{ color: 'var(--subtitle)' }}>Net annuel</th>
                      <th className="text-right py-3 px-3 font-bold" style={{ color: 'var(--subtitle)' }}>Net mensuel</th>
                      {!useCA && <th className="text-right py-3 px-3 font-bold" style={{ color: 'var(--subtitle)' }}>Jours off</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, idx) => (
                      <tr key={idx} className="transition-colors" style={{ borderBottom: `1px solid var(--card-border)` }}>
                        <td className="py-3 px-3 font-bold" style={{ color: 'var(--accent)' }}>{s.label}</td>
                        <td className="py-3 px-3 text-right font-medium" style={{ color: 'var(--title)' }}><Copyable value={Math.round(s.ca)}>{fmt(s.ca)}&euro;</Copyable></td>
                        <td className="py-3 px-3 text-right font-medium" style={{ color: 'var(--title)' }}><Copyable value={Math.round(s.caMensuel)}>{fmt(s.caMensuel)}&euro;</Copyable></td>
                        <td className="py-3 px-3 text-right font-bold" style={{ color: 'var(--kpi-positive)' }}><Copyable value={Math.round(s.net)}>{fmt(s.net)}&euro;</Copyable></td>
                        <td className="py-3 px-3 text-right font-bold text-base" style={{ color: 'var(--kpi-positive)' }}><Copyable value={Math.round(s.netMensuel)}>{fmt(s.netMensuel)}&euro;</Copyable></td>
                        {!useCA && <td className="py-3 px-3 text-right font-medium" style={{ color: 'var(--subtitle)' }}>{s.joursOff}j</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Graphique barres */}
            <Card className="p-4 sm:p-6">
              <CardTitle>Comparaison des sc&eacute;narios</CardTitle>
              <div className="h-[280px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scenarios} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="label" stroke={colors.accent} style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13 }} />
                    <YAxis stroke={colors.accent} style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k\u20AC`} />
                    <Tooltip formatter={(v) => `${fmt(v)}\u20AC`} contentStyle={tooltipStyle} itemStyle={tooltipTextStyle} labelStyle={tooltipTextStyle} cursor={{ fill: `color-mix(in srgb, ${colors.accent} 5%, transparent)` }} />
                    <Legend wrapperStyle={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13 }} iconType="circle" />
                    <Bar dataKey="ca" name="CA annuel" fill={`url(#barCA-${dark ? 'd' : 'l'})`} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="charges" name="Charges totales" fill={`url(#barCharges-${dark ? 'd' : 'l'})`} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="net" name="Net annuel" fill={`url(#barNet-${dark ? 'd' : 'l'})`} radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id={`barCA-${dark ? 'd' : 'l'}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.barCA[0]} />
                        <stop offset="100%" stopColor={colors.barCA[1]} />
                      </linearGradient>
                      <linearGradient id={`barCharges-${dark ? 'd' : 'l'}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.barCharges[0]} />
                        <stop offset="100%" stopColor={colors.barCharges[1]} />
                      </linearGradient>
                      <linearGradient id={`barNet-${dark ? 'd' : 'l'}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.barNet[0]} />
                        <stop offset="100%" stopColor={colors.barNet[1]} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Camembert */}
            <Card className="p-4 sm:p-6">
              <CardTitle>R&eacute;partition du CA annuel</CardTitle>
              {/* Desktop */}
              <div className="hidden sm:block">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="40%" cy="50%" labelLine={false} label={({ percent }) => percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : ''} outerRadius={110} innerRadius={50} dataKey="value" style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14 }}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke={dark ? '#1f1f1f' : '#fffef9'} strokeWidth={2} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${fmt(v)}\u20AC`} contentStyle={tooltipStyle} itemStyle={tooltipTextStyle} labelStyle={tooltipTextStyle} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle"
                        wrapperStyle={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, paddingLeft: '20px' }}
                        formatter={(value, entry) => {
                          const total = pieData.reduce((s, i) => s + i.value, 0);
                          const iv = entry.payload?.value || 0;
                          const pct = total > 0 ? ((iv / total) * 100).toFixed(1) : '0';
                          return <span style={{ color: dark ? '#ececec' : '#111' }}>{value} <span style={{ color: dark ? '#999' : '#555', fontSize: 12 }}>({pct}% &bull; {fmt(iv)}&euro;)</span></span>;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Mobile */}
              <div className="sm:hidden">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ percent }) => percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : ''} outerRadius={85} innerRadius={40} dataKey="value" style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 12 }}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke={dark ? '#1f1f1f' : '#fffef9'} strokeWidth={2} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${fmt(v)}\u20AC`} contentStyle={{ ...tooltipStyle, padding: '8px' }} itemStyle={tooltipTextStyle} labelStyle={tooltipTextStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {pieData.map((item) => {
                    const total = pieData.reduce((s, i) => s + i.value, 0);
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                    return (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate" style={{ color: 'var(--title)' }}>{item.name}</span>
                        <span className="shrink-0 ml-auto" style={{ color: 'var(--subtitle)' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* D\u00e9tail charges */}
            <Card>
              <CardTitle>D&eacute;tail des charges annuelles</CardTitle>
              <div className="space-y-3">
                {detailCharges.map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 px-3 rounded-lg transition-colors" style={{ borderBottom: `1px solid var(--card-border)` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                      <span className="font-medium" style={{ color: 'var(--title)' }}>{label}</span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--title)' }}>{fmt(value)}&euro;</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 rounded-xl px-4 mt-4" style={{ background: 'var(--accent-light)' }}>
                  <span className="font-bold text-lg" style={{ color: 'var(--title)' }}>TOTAL</span>
                  <span className="font-bold text-xl" style={{ color: 'var(--accent)' }}>{fmt(calculs.totalCharges + calculs.totalFrais)}&euro;</span>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <footer className="mt-12 pb-6 text-center">
          <p className="text-sm" style={{ color: 'var(--subtitle)' }}>
            Cr&eacute;&eacute; par{' '}
            <a href="https://elouanb7.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 transition-colors" style={{ color: 'var(--accent)' }}>
              Elouan B.
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
