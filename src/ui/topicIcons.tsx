import { memo } from 'react'

/**
 * Line glyphs for every topic in the sidebar. Each glyph is drawn on a 24×24 grid with one stroke style.
 * A topic = a glyph + an optional short badge (Σ, τ, Vf…) so related topics look related but never identical.
 */
const D = (...paths: string[]) => paths.join(' ')
const GLYPHS: Record<string, string> = {
  // quantities & units
  omega: D('M4 20h5v-3a7 7 0 1 1 6 0v3h5'),
  bolt: D('M13 2L5 14h6l-1 8 8-12h-6z'),
  ruler: D('M2 8h20v8H2z', 'M6 8v4M10 8v3M14 8v4M18 8v3'),
  // components
  resistor: D('M1 12h4l2-5 4 10 4-10 2 5h6'),
  capacitor: D('M1 12h9M14 12h9M10 5v14M14 5v14'),
  inductor: D('M1 15h3a2.8 4.5 0 0 1 5.6 0a2.8 4.5 0 0 1 5.6 0a2.8 4.5 0 0 1 5.6 0h2.4'),
  battery: D('M2 7h17v10H2z', 'M22 10v4', 'M6 10v4M10 10v4M14 10v4'),
  diode: D('M1 12h6M17 12h6M7 6l10 6-10 6z', 'M17 6v12'),
  led: D('M1 14h5M18 14h5M6 8l10 6-10 6z', 'M16 8v12', 'M13 4l4-3M18 7l4-3'),
  zener: D('M1 12h6M17 12h6M7 6l10 6-10 6z', 'M20 6h-3v12h-3'),
  bjt: D('M12 3a9 9 0 1 0 .01 0', 'M2 12h6M8 7v10M8 10l7-5V2M8 14l7 5v3', 'M15 19l-3.2-.7M15 19l-.7-3.2'),
  mosfet: D('M2 12h5M7 6v12M10 6.5v3M10 10.5v3M10 14.5v3M10 8h9V3M10 16h9v5M10 12h9'),
  transformer: D('M8 2a2.5 2.5 0 0 1 0 5a2.5 2.5 0 0 1 0 5a2.5 2.5 0 0 1 0 5a2.5 2.5 0 0 1 0 5', 'M16 2a2.5 2.5 0 0 0 0 5a2.5 2.5 0 0 0 0 5a2.5 2.5 0 0 0 0 5a2.5 2.5 0 0 0 0 5', 'M11.5 2v20M13.5 2v20'),
  crystal: D('M1 12h6M17 12h6M9 6v12M15 6v12M10.5 8h3v8h-3z'),
  chip: D('M7 5h10v14H7z', 'M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4', 'M10.5 5a1.5 1.5 0 0 0 3 0'),
  bands: D('M1 12h3M20 12h3', 'M6 8h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z', 'M9 8v8M12 8v8M15 8v8'),
  // networks
  seriesR: D('M1 12h3M4 9.5h6v5H4zM10 12h4M14 9.5h6v5h-6zM20 12h3'),
  parallelR: D('M3 4h18M3 20h18', 'M8 4v3M8 17v3M5.5 7h5v10h-5z', 'M16 4v3M16 17v3M13.5 7h5v10h-5z'),
  seriesC: D('M1 12h5M6 6v12M9 6v12M9 12h6M15 6v12M18 6v12M18 12h5'),
  parallelC: D('M4 7v10M20 7v10', 'M4 7h6M14 7h6M10 4v6M14 4v6', 'M4 17h6M14 17h6M10 14v6M14 14v6'),
  seriesL: D('M1 13h2a2.4 4 0 0 1 4.8 0a2.4 4 0 0 1 4.8 0M12.6 13h1a2.4 4 0 0 1 4.8 0a2.4 4 0 0 1 4.8 0'),
  parallelL: D('M4 5v14M20 5v14', 'M4 7h2a2.2 2.2 0 0 1 4.4 0a2.2 2.2 0 0 1 4.4 0h5.2', 'M4 17h2a2.2 2.2 0 0 1 4.4 0a2.2 2.2 0 0 1 4.4 0h5.2'),
  divider: D('M12 1v3M9.5 4h5v6h-5zM12 10v2M9.5 12h5v6h-5zM12 18v3M14.5 11h8'),
  sp: D('M1 12h3M4 9.5h5v5H4zM9 12h3M12 6v12M12 6h2M14 4h7v4h-7zM12 18h2M14 16h7v4h-7z'),
  bridge: D('M12 2l9 10-9 10-9-10z', 'M3 12h18'),
  tree: D('M9 2h6v4H9zM12 6v3M5 9h14M5 9v3M19 9v3M2 12h6v5H2zM16 12h6v5h-6z'),
  swap: D('M4 8h14l-3-3M20 16H6l3 3'),
  loop: D('M5 7h14v10H5z', 'M15 4l3 3-3 3'),
  node: D('M2 12h8M14 12h8M12 2v8M12 14v8', 'M12 10a2 2 0 1 0 .01 0'),
  pack: D('M1 8h4M5 5v6M8 6.5v3M8 8h4M12 5v6M15 6.5v3M15 8h8', 'M1 17h4M5 14v6M8 15.5v3M8 17h4M12 14v6M15 15.5v3M15 17h8'),
  // signals & graphs
  sine: D('M1 12c3-10 6-10 8 0s5 10 8 0 4-8 6-4'),
  curveUp: D('M3 3v18h18', 'M5 19c3-10 7-13 15-14'),
  curveDown: D('M3 3v18h18', 'M5 5c3 10 7 13 15 14'),
  bell: D('M2 20h20', 'M2 20c6 0 6-16 10-16s4 16 10 16'),
  lowpass: D('M2 6h9c4 0 5 12 11 12'),
  dbcurve: D('M3 3v18h18', 'M5 19Q9 7 20 6'),
  stairs: D('M3 3v18h18', 'M5 19h4v-4h4v-4h4v-4h3'),
  pulse: D('M2 18h4V6h6v12h4V6h6'),
  frame: D('M1 6h4v12h3V6h3v12h3V6h3v12h3V6h3'),
  bus: D('M1 8h22M1 16h22M6 8V4M12 16v4M18 8V4'),
  clock: D('M12 3a9 9 0 1 0 .01 0', 'M12 7v5l3 2'),
  triangle: D('M3 20h18V5z'),
  phasor: D('M3 20h18M3 20L17 7', 'M10 20a7 7 0 0 0-2-5'),
  gauge: D('M3 18a9 9 0 1 1 18 0', 'M12 18l5-6'),
  // physical
  wire: D('M4 8h13M4 16h13', 'M4 8a2 4 0 0 0 0 8M17 8a2 4 0 0 1 0 8'),
  trace: D('M2 17h20v4H2z', 'M6 17v-4h12v4'),
  skin: D('M12 3a9 9 0 1 0 .01 0', 'M12 8a4 4 0 1 0 .01 0'),
  thermometer: D('M10 3a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z', 'M12 8v9'),
  antenna: D('M12 22V10', 'M6 5c-2 3-2 6 0 9M18 5c2 3 2 6 0 9M9 7c-1 2-1 3 0 5M15 7c1 2 1 3 0 5', 'M12 10a1.2 1.2 0 1 0 .01 0'),
  dipole: D('M12 2v8M12 14v8M8 10h8M8 14h8'),
}

/** formula id → [glyph, badge]. Every topic needs a unique pair (checked by tests/nav.test.tsx). */
export const TOPIC_ICONS: Record<string, [glyph: keyof typeof GLYPHS, badge: string]> = {
  'units-and-prefixes': ['ruler', 'µ'],
  'ohms-law': ['omega', 'V'], power: ['bolt', 'P'],
  'r-series': ['seriesR', 'Σ'], 'r-parallel-2': ['parallelR', '2'], 'r-parallel-n': ['parallelR', 'n'], 'voltage-divider': ['divider', 'V'], 'current-divider': ['parallelR', 'I'], 'resistor-colour-code': ['bands', ''],
  'c-series': ['seriesC', ''], 'c-parallel': ['parallelC', ''], 'cap-charge': ['capacitor', 'Q'], 'cap-energy': ['capacitor', 'E'], 'cap-reactance': ['capacitor', 'X'],
  'rc-tau': ['clock', 'τ'], 'rc-charging': ['curveUp', ''], 'rc-discharging': ['curveDown', ''], 'settling-time': ['curveUp', '5τ'],
  'l-series': ['seriesL', ''], 'l-parallel': ['parallelL', ''], 'ind-reactance': ['inductor', 'X'], 'ind-energy': ['inductor', 'E'], 'rl-tau': ['clock', 'L'], 'induced-voltage': ['inductor', 'V'],
  'resonant-frequency': ['bell', 'f0'], 'q-series': ['bell', 'Qs'], 'q-parallel': ['bell', 'Qp'], bandwidth: ['bell', 'BW'], 'rc-cutoff': ['lowpass', 'RC'], 'rl-cutoff': ['lowpass', 'RL'],
  'diode-vf': ['diode', 'Vf'], 'led-vf': ['led', 'Vf'], 'led-resistor': ['led', 'R'],
  'bjt-gain': ['bjt', 'β'], 'bjt-emitter': ['bjt', 'IE'], 'bjt-base-resistor': ['bjt', 'RB'], 'bjt-typical-voltages': ['bjt', 'V'], 'bjt-power': ['bjt', 'P'],
  'mosfet-vgs-th': ['mosfet', 'Vth'], 'mosfet-power': ['mosfet', 'P'], 'mosfet-gate-current': ['mosfet', 'Qg'], 'mosfet-logic-level': ['mosfet', '5V'],
  'impedance-complex': ['triangle', 'jX'], 'impedance-magnitude': ['triangle', '|Z|'], 'phase-angle': ['phasor', 'θ'],
  'vrms-from-peak': ['sine', 'rms'], 'vpeak-from-rms': ['sine', 'pk'], vpp: ['sine', 'pp'], 'rectified-average': ['sine', 'avg'],
  '555-astable-frequency': ['chip', 'f'], '555-astable-duty': ['chip', 'D'], '555-monostable': ['chip', 't'],
  'db-power': ['dbcurve', 'P'], 'db-voltage': ['dbcurve', 'V'], wavelength: ['sine', 'λ'], 'frequency-period': ['clock', 'f'],
  'wire-resistance': ['wire', 'R'], 'cable-voltage-drop': ['wire', 'ΔV'], 'charge-current-time': ['clock', 'Q'], kvl: ['loop', ''], kcl: ['node', ''], 'power-factor': ['phasor', 'PF'],
  'adc-reading': ['stairs', 'n'], 'adc-step': ['stairs', 'Δ'], nyquist: ['sine', '2f'], pwm: ['pulse', 'D'], 'gpio-led-resistor': ['led', 'IO'], decoupling: ['capacitor', 'IC'], 'crystal-load': ['crystal', 'CL'], 'uart-bit-time': ['frame', 'bit'], 'i2c-pullup-min': ['bus', 'min'], 'i2c-pullup-max': ['bus', 'max'],
  'ipc-2221': ['trace', 'I'], 'trace-resistance': ['trace', 'R'], 'microstrip-z0': ['trace', 'Z0'], 'propagation-delay': ['trace', 'tpd'], 'critical-length': ['trace', 'Lc'], 'skin-depth': ['skin', 'δ'], 'cap-self-resonance': ['capacitor', 'SRF'],
  'battery-capacity': ['battery', 'Ah'], 'c-rate': ['battery', 'C'], 'battery-runtime': ['battery', 't'], 'battery-energy': ['battery', 'Wh'], 'voltage-sag': ['battery', 'ΔV'], 'state-of-charge': ['gauge', '%'],
  'quarter-wave': ['antenna', 'λ/4'], 'half-wave-dipole': ['dipole', 'λ/2'], fspl: ['antenna', 'dB'], 'reflection-coefficient': ['antenna', 'Γ'], vswr: ['antenna', 'SWR'], 'return-loss': ['antenna', 'RL'], dbm: ['dbcurve', 'dBm'], 'far-field': ['antenna', 'r'],
  'solving-method': ['tree', ''], 'reverse-formulas': ['swap', ''],
  'p1-unknown-parallel': ['parallelR', 'R?'], 'p2-series-parallel': ['sp', ''], 'p3-unknown-series': ['seriesR', 'Rx'], 'p4-thevenin': ['battery', 'Th'], 'p5-millman': ['node', 'V'],
  'p6-adc-divider': ['divider', 'ADC'], 'p7-sensor-divider': ['divider', 'Rs'], 'p8-wheatstone': ['bridge', ''],
  'p9-time-to-voltage': ['curveUp', 't'], 'p10-choose-rc': ['capacitor', 'RC'], 'p11-choose-lc': ['bell', 'LC'], 'p12-ac-measurement': ['sine', '?'],
  'p13-several-leds': ['led', 'n'], 'p14-zener': ['zener', ''], 'p15-transformer-rectifier': ['transformer', ''], 'p16-heat': ['thermometer', 'θ'],
  'p17-bjt-switch': ['bjt', 'sw'], 'p18-bjt-bias': ['bjt', 'Q'], 'p19-mosfet-switch': ['mosfet', 'sw'],
  'p20-internal-resistance': ['battery', 'Ri'], 'p21-battery-packs': ['pack', ''],
}

const badgeSize = (b: string) => (b.length <= 1 ? 9.5 : b.length === 2 ? 8 : b.length === 3 ? 7 : 6)

/** Small line icon for a topic (decorative: aria-hidden). A plain <svg> — lists render ~120 of these, so no styled wrappers. */
export const TopicIcon = memo(function TopicIcon({ id, size = 28 }: { id: string; size?: number }) {
  const spec = TOPIC_ICONS[id]
  const glyph = spec ? GLYPHS[spec[0]] : undefined
  const badge = spec?.[1] ?? ''
  return (
    <svg className="topic-icon" width={size} height={size} viewBox="0 0 24 24" data-testid={`topic-icon-${id}`} data-glyph={spec?.[0]} data-badge={badge} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth={badge ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" transform={badge ? 'translate(0.6 0.4) scale(0.7)' : undefined}>
        {glyph ? <path d={glyph} /> : <circle cx="12" cy="12" r="4" />}
      </g>
      {badge && <text x="23.4" y="21.6" textAnchor="end" fontSize={badgeSize(badge)} fontWeight={800} fill="currentColor" stroke="none" fontFamily="system-ui, sans-serif">{badge}</text>}
    </svg>
  )
})
export const GLYPH_NAMES = Object.keys(GLYPHS)
