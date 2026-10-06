/**
 * The book: the order in which the app teaches electronics, from the easiest topics to the hardest.
 * Parts → chapters → topics (formula / reference-page ids from `src/formulas`).
 *
 * Ids are permanent URL slugs (`#/part/<id>`, `#/chapter/<id>`, `#/topic/<id>`): never rename one, and never derive
 * a URL from a position — moving a chapter must not break a shared link. tests/book.test.ts checks that every topic
 * appears exactly once and that every id is unique.
 */
export interface Chapter {
  id: string
  /** "4.2" — part number . position, recomputed from the order below */
  number: string
  title: string
  blurb: string
  /** topic whose diagram is the chapter's picture */
  hero: string
  /** topic ids in reading order */
  items: string[]
  partId: string
}

export interface Part {
  id: string
  number: string
  title: string
  blurb: string
  hero: string
  chapters: Chapter[]
}

type ChapterDef = Omit<Chapter, 'number' | 'partId'>
type PartDef = Omit<Part, 'number' | 'chapters'> & { chapters: ChapterDef[] }

const BOOK: PartDef[] = [
  {
    id: 'basics', title: 'Basics: quantities & units', hero: 'ohms-law',
    blurb: 'Units and prefixes, voltage, current, resistance and power — the words every other page uses.',
    chapters: [
      { id: 'units', title: 'Units & prefixes', hero: 'units-and-prefixes', blurb: 'Read this first: convert kΩ, mA and µF to base units before you calculate.', items: ['units-and-prefixes'] },
      { id: 'voltage-current-resistance', title: 'Voltage, current & resistance', hero: 'ohms-law', blurb: 'What V, I and R are and how Ohm’s law ties them together.', items: ['vir-explained', 'ohms-law', 'charge-current-time'] },
      { id: 'power', title: 'Power & heat', hero: 'power', blurb: 'How much energy a part turns into heat every second.', items: ['power'] },
      { id: 'schematics', title: 'Schematics, breadboard & safety', hero: 'schematic-symbols', blurb: 'Read a circuit diagram, build it on a breadboard and stay safe.', items: ['schematic-symbols', 'breadboard', 'bench-safety'] },
    ],
  },
  {
    id: 'measurements', title: 'Basic measurements', hero: 'multimeter',
    blurb: 'Using a multimeter: voltage, current, resistance, continuity — and how the meter itself changes the reading.',
    chapters: [
      { id: 'multimeter', title: 'Using a multimeter', hero: 'multimeter', blurb: 'Volts in parallel, amps in series, ohms with the power off.', items: ['multimeter', 'diode-vf'] },
      { id: 'measurement-errors', title: 'Measurement errors', hero: 'meter-loading', blurb: 'Why the meter reads less than you calculated: loading and burden voltage.', items: ['meter-loading', 'burden-voltage'] },
      { id: 'measuring-sources', title: 'Measuring a source', hero: 'p20-internal-resistance', blurb: 'Two voltage readings reveal a battery’s internal resistance.', items: ['p20-internal-resistance'] },
    ],
  },
  {
    id: 'signals', title: 'Signals', hero: 'vrms-from-peak',
    blurb: 'DC, AC and pulses; reading them with an oscilloscope and a logic analyser; decibels and wavelength.',
    chapters: [
      { id: 'dc-ac-pulses', title: 'DC, AC & pulses', hero: 'vrms-from-peak', blurb: 'Frequency, period, peak, RMS and duty cycle of the common waveforms.', items: ['signals-explained', 'frequency-period', 'waveform-values', 'vrms-from-peak', 'vpeak-from-rms', 'vpp', 'rectified-average', 'pwm'] },
      { id: 'oscilloscope', title: 'Using an oscilloscope', hero: 'scope-reading', blurb: 'Volts and time per division, triggering, probes and bandwidth.', items: ['oscilloscope', 'scope-reading', 'rise-time-bandwidth'] },
      { id: 'decibels-wavelength', title: 'Decibels & wavelength', hero: 'db-power', blurb: 'Ratios in dB, dBm and how long one wave is.', items: ['db-power', 'db-voltage', 'dbm', 'wavelength'] },
      { id: 'digital-signals', title: 'Digital signals & logic analyser', hero: 'uart-bit-time', blurb: 'Logic levels, noise margins, sample rate and serial bit timing.', items: ['logic-analyser', 'logic-levels', 'analyser-sample-rate', 'nyquist', 'uart-bit-time'] },
    ],
  },
  {
    id: 'components', title: 'Components', hero: 'voltage-divider',
    blurb: 'From wires and resistors to transistors — and finally the 555 timer and other ICs.',
    chapters: [
      { id: 'wires', title: 'Wires & cables', hero: 'wire-resistance', blurb: 'Every wire is a small resistor: resistance and voltage drop.', items: ['wire-resistance', 'cable-voltage-drop'] },
      { id: 'resistors', title: 'Resistors', hero: 'voltage-divider', blurb: 'Colour code, series and parallel, Kirchhoff’s laws, dividers and unknown resistors.', items: ['resistor-colour-code', 'e-series', 'r-series', 'r-parallel-2', 'r-parallel-n', 'kvl', 'kcl', 'voltage-divider', 'current-divider', 'solving-method', 'reverse-formulas', 'p1-unknown-parallel', 'p3-unknown-series', 'p2-series-parallel'] },
      { id: 'capacitors', title: 'Capacitors', hero: 'rc-charging', blurb: 'Charge, energy, RC timing and how capacitors behave with AC.', items: ['cap-charge', 'cap-energy', 'c-series', 'c-parallel', 'capacitor-code', 'rc-tau', 'rc-charging', 'rc-discharging', 'settling-time', 'cap-reactance', 'p9-time-to-voltage'] },
      { id: 'inductors', title: 'Inductors', hero: 'induced-voltage', blurb: 'Magnetic energy, RL timing, switching spikes and reactance.', items: ['l-series', 'l-parallel', 'ind-energy', 'rl-tau', 'induced-voltage', 'ind-reactance'] },
      { id: 'diodes-leds', title: 'Diodes & LEDs', hero: 'led-resistor', blurb: 'Forward voltage, the LED resistor, LED strings and Zener regulators.', items: ['led-vf', 'led-resistor', 'p13-several-leds', 'p14-zener'] },
      { id: 'batteries', title: 'Batteries', hero: 'battery-energy', blurb: 'Capacity, runtime, C-rate, voltage sag and battery packs.', items: ['battery-capacity', 'battery-energy', 'battery-runtime', 'c-rate', 'voltage-sag', 'state-of-charge', 'p21-battery-packs'] },
      { id: 'bjt', title: 'BJT transistors', hero: 'bjt-gain', blurb: 'Gain, the base resistor, switching a load and biasing an amplifier.', items: ['bjt-typical-voltages', 'bjt-gain', 'bjt-emitter', 'bjt-base-resistor', 'bjt-power', 'p17-bjt-switch', 'p18-bjt-bias'] },
      { id: 'mosfets', title: 'MOSFETs', hero: 'mosfet-power', blurb: 'Threshold, logic-level parts, gate drive and conduction loss.', items: ['mosfet-vgs-th', 'mosfet-logic-level', 'mosfet-gate-current', 'mosfet-power', 'p19-mosfet-switch'] },
      { id: 'timers-ics', title: '555 timer & ICs', hero: '555-astable-frequency', blurb: 'The 555 timer, op-amps and linear voltage regulators.', items: ['555-astable-frequency', '555-astable-duty', '555-monostable', 'p10-choose-rc', 'op-amp-gain', 'linear-regulator'] },
    ],
  },
  {
    id: 'advanced', title: 'Advanced electronics', hero: 'adc-reading',
    blurb: 'Microcontrollers, power supplies, AC analysis and filters, network theorems, PCB layout and RF.',
    chapters: [
      { id: 'microcontrollers', title: 'Microcontrollers', hero: 'adc-reading', blurb: 'GPIO, ADC inputs and sensors, I²C pull-ups, crystals and decoupling.', items: ['gpio-led-resistor', 'adc-step', 'adc-reading', 'p6-adc-divider', 'p7-sensor-divider', 'p8-wheatstone', 'i2c-pullup-min', 'i2c-pullup-max', 'crystal-load', 'decoupling'] },
      { id: 'power-supplies', title: 'Power supplies', hero: 'p15-transformer-rectifier', blurb: 'Transformer, rectifier and smoothing; heat and heatsinks; power factor.', items: ['p15-transformer-rectifier', 'p16-heat', 'power-factor'] },
      { id: 'ac-filters', title: 'AC circuits & filters', hero: 'impedance-magnitude', blurb: 'Impedance and phase, RC/RL filters, resonance and Q.', items: ['impedance-complex', 'impedance-magnitude', 'phase-angle', 'rc-cutoff', 'rl-cutoff', 'resonant-frequency', 'q-series', 'q-parallel', 'bandwidth', 'p11-choose-lc', 'p12-ac-measurement'] },
      { id: 'network-theorems', title: 'Network theorems', hero: 'p4-thevenin', blurb: 'Replace a whole circuit with one source (Thévenin, Millman).', items: ['p4-thevenin', 'p5-millman'] },
      { id: 'pcb', title: 'PCB layout & signal integrity', hero: 'microstrip-z0', blurb: 'Trace width and resistance, impedance, delay and skin depth.', items: ['ipc-2221', 'trace-resistance', 'microstrip-z0', 'propagation-delay', 'critical-length', 'skin-depth', 'cap-self-resonance'] },
      { id: 'rf', title: 'RF & antennas', hero: 'vswr', blurb: 'Antenna length, path loss, reflections and VSWR.', items: ['quarter-wave', 'half-wave-dipole', 'fspl', 'reflection-coefficient', 'vswr', 'return-loss', 'far-field'] },
    ],
  },
]

export const PARTS: Part[] = BOOK.map((p, pi) => ({
  ...p,
  number: String(pi + 1),
  chapters: p.chapters.map((c, ci) => ({ ...c, number: `${pi + 1}.${ci + 1}`, partId: p.id })),
}))
export const CHAPTERS: Chapter[] = PARTS.flatMap((p) => p.chapters)
/** every topic id in reading order */
export const READING_ORDER: string[] = CHAPTERS.flatMap((c) => c.items)

const chapterOfTopic = new Map<string, Chapter>(CHAPTERS.flatMap((c) => c.items.map((id) => [id, c] as const)))
const position = new Map<string, number>(READING_ORDER.map((id, i) => [id, i]))

export const partById = (id: string): Part | undefined => PARTS.find((p) => p.id === id)
export const chapterById = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.id === id)
export const chapterOf = (topicId: string): Chapter | undefined => chapterOfTopic.get(topicId)
export const partOf = (chapter: Chapter): Part => partById(chapter.partId)!

/** the topics before and after this one in reading order (across chapter boundaries) */
export function neighbours(topicId: string): { prev?: string; next?: string } {
  const i = position.get(topicId)
  if (i === undefined) return {}
  return { prev: READING_ORDER[i - 1], next: READING_ORDER[i + 1] }
}
