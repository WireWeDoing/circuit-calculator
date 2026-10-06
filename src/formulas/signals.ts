/* Signals and the instruments that show them (Part 3 of the book): waveforms, oscilloscope, logic analyser. */
import { defineFormula, ex, field, mode } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { kilo, mega, micro, nano } from '../core/units.ts'

export const signalsExplained = defineFormula({
  id: 'signals-explained', title: 'DC, AC and pulses',
  equation: 'f = 1 / T',
  meaning: 'A signal is a voltage that may change over time. DC stays put, AC swings above and below zero, pulses jump between two levels. Each kind is described by a few numbers: level, amplitude, frequency and duty cycle.',
  analogy: 'DC is a steady stream, AC is a wave rolling back and forth on a beach, pulses are a tap switched on and off.',
  fields: [], unitsNote: '', modes: [], visual: 'signals', keywords: ['dc', 'ac', 'waveform', 'signal', 'frequency'],
  article: [
    {
      heading: 'DC — direct current',
      text: 'The voltage stays (nearly) constant: batteries, USB, the output of a regulator. Measure it with the multimeter on V⎓.',
    },
    {
      heading: 'AC — alternating current',
      text: 'The voltage swings above and below zero, usually as a sine wave: mains, audio, radio. A multimeter on V~ shows its RMS value — the DC voltage that would heat a resistor equally. To see the shape, use an oscilloscope.',
    },
    {
      heading: 'Pulses and digital signals',
      text: 'The voltage switches between two levels: clocks, PWM, data lines. The share of time spent high is the duty cycle. A multimeter shows only the average, so use a scope or logic analyser to see what really happens.',
    },
    {
      heading: 'Numbers that describe a signal',
      table: [
        ['Quantity', 'Meaning', 'Mains example (230 V, 50 Hz)'],
        ['Period T', 'time for one full cycle', '20 ms'],
        ['Frequency f = 1 / T', 'cycles per second, hertz (Hz)', '50 Hz'],
        ['Peak Vp', 'from 0 to the top', '325 V'],
        ['Peak-to-peak Vpp', 'from bottom to top', '650 V'],
        ['RMS', 'equivalent heating (DC) value', '230 V'],
        ['DC offset', 'average level the wave rides on', '0 V'],
        ['Duty cycle', 'share of time high (pulses)', '—'],
      ],
    },
  ],
})

const shapes = {
  sine: { label: 'Sine', rms: 1 / Math.SQRT2, rmsText: 'Vp / √2 = 0.707 × Vp', avg: 2 / Math.PI, avgText: '2 × Vp / π = 0.637 × Vp' },
  square: { label: 'Square', rms: 1, rmsText: 'Vp', avg: 1, avgText: 'Vp' },
  triangle: { label: 'Triangle', rms: 1 / Math.sqrt(3), rmsText: 'Vp / √3 = 0.577 × Vp', avg: 0.5, avgText: 'Vp / 2' },
}
const waveMode = (id: keyof typeof shapes, example: [number, string]) => {
  const s = shapes[id]
  return mode({
    id, label: s.label, inputs: ['Vp'], outputs: ['Vpp', 'Vrms', 'Vavg'], equation: `Vrms = ${s.rmsText}`,
    compute: (v) => ({ Vpp: 2 * v.Vp, Vrms: v.Vp * s.rms, Vavg: v.Vp * s.avg }),
    steps: (v, o) => [
      `Peak-to-peak = 2 × Vp = 2 × ${S('voltage', v.Vp)} = ${S('voltage', o.Vpp)}`,
      `RMS of a ${s.label.toLowerCase()} wave = ${s.rmsText} = ${S('voltage', o.Vrms)}`,
      `Average of the rectified wave (what an averaging meter works from) = ${s.avgText} = ${S('voltage', o.Vavg)}`,
    ],
    examples: [ex(example[1], { Vp: example[0] }, { Vpp: 2 * example[0], Vrms: example[0] * s.rms, Vavg: example[0] * s.avg })],
  })
}

export const waveformValues = defineFormula({
  id: 'waveform-values', title: 'Peak, RMS and average of common waveforms',
  equation: 'sine: Vrms = 0.707 Vp · square: Vrms = Vp · triangle: Vrms = 0.577 Vp',
  meaning: 'The same peak voltage gives a different RMS (heating) value for different shapes. Pick the shape to convert the peak you read on a scope into the RMS a meter would show.',
  fields: [
    field('Vp', 'Vp', 'Peak voltage', 'voltage', { sign: 'pos', description: 'from 0 V (the centre line) to the top of the wave' }),
    field('Vpp', 'Vpp', 'Peak-to-peak', 'voltage'),
    field('Vrms', 'Vrms', 'RMS value', 'voltage'),
    field('Vavg', 'Vavg', 'Rectified average', 'voltage'),
  ],
  unitsNote: 'For waves centred on 0 V. A cheap (averaging) meter assumes a sine: on a square or triangle wave only a “True RMS” meter reads correctly.',
  visual: 'waveforms', keywords: ['rms', 'peak', 'square wave', 'triangle wave', 'true rms'],
  modes: [waveMode('sine', [10, 'sine, 10 V peak']), waveMode('square', [5, 'square, 5 V peak']), waveMode('triangle', [3, 'triangle, 3 V peak'])],
})

export const oscilloscope = defineFormula({
  id: 'oscilloscope', title: 'Using an oscilloscope',
  equation: 'V = divisions × V/div · t = divisions × s/div',
  meaning: 'An oscilloscope draws voltage (up) against time (across). It shows the shape of a signal: its amplitude, frequency, noise, ringing and timing between channels.',
  analogy: 'A multimeter gives you one number; a scope gives you the whole movie.',
  fields: [], unitsNote: '', modes: [], visual: 'scope', keywords: ['scope', 'oscilloscope', 'probe', 'trigger'],
  article: [
    {
      heading: 'The screen',
      text: 'The grid is usually 10 divisions wide and 8 high. The vertical setting (V/div) says how many volts one square is; the time base (s/div) says how much time one square is.',
    },
    {
      heading: 'Controls you will use',
      table: [
        ['Control', 'What it does'],
        ['V/div (vertical scale)', 'zoom the voltage in or out'],
        ['s/div (time base)', 'zoom time in or out'],
        ['Position', 'move the trace up/down or left/right'],
        ['Trigger level & edge', 'start each sweep at the same point so the picture stands still'],
        ['Coupling DC / AC', 'AC hides the DC offset to see small ripple on a big DC voltage'],
        ['Probe ×1 / ×10', 'must match the switch on the probe'],
        ['Auto set / Measure / Cursors', 'quick picture, automatic Vpp/frequency, precise readings'],
      ],
    },
    {
      heading: 'Probes',
      bullets: [
        'Use ×10 by default: 10 MΩ input, far less loading and full bandwidth. ×1 is only for very small signals.',
        'Compensate a ×10 probe once: connect it to the scope’s 1 kHz calibration square wave and turn the small trimmer until the corners are flat.',
        'The ground clip is connected to mains earth through the scope. Clip it only to the circuit’s ground — clipping it anywhere else creates a short.',
        'For fast edges use the short ground spring instead of the long clip lead.',
      ],
    },
    {
      heading: 'A quick measurement',
      bullets: ['Press Auto set (or start at 1 V/div and 1 ms/div).', 'Adjust V/div until the signal fills about 6 divisions.', 'Adjust s/div to show 2–3 periods.', 'Set the trigger level to the middle of the signal.', 'Count divisions — or use Measure / cursors — for Vpp and the period.'],
    },
  ],
})

export const scopeReading = defineFormula({
  id: 'scope-reading', title: 'Reading the scope screen',
  equation: 'Vpp = divisions × V/div × probe · T = divisions × s/div · f = 1 / T',
  meaning: 'Count the squares, then multiply by the setting. Vertically you get volts, horizontally you get time; one period in time gives the frequency.',
  fields: [
    field('divV', 'div (V)', 'Divisions, bottom to top', 'div', { sign: 'pos', description: 'peak-to-peak height of the trace in squares' }),
    field('Vdiv', 'V/div', 'Vertical setting', 'voltage', { sign: 'pos' }),
    field('probe', '×probe', 'Probe factor', 'ratio', { sign: 'pos', description: '1 if the scope channel is already set to match the probe; 10 if the probe is on ×10 but the channel says ×1', presets: [{ label: '×1', value: 1 }, { label: '×10', value: 10 }] }),
    field('Vpp', 'Vpp', 'Peak-to-peak voltage', 'voltage'),
    field('divT', 'div (t)', 'Divisions for one period', 'div', { sign: 'pos' }),
    field('tdiv', 's/div', 'Time base setting', 'time', { sign: 'pos' }),
    field('T', 'T', 'Period', 'time'),
    field('f', 'f', 'Frequency', 'frequency'),
  ],
  unitsNote: 'Read the settings from the screen (e.g. “500mV” and “250µs”). Most scopes divide the screen into 5 small ticks per division, so 0.2 division resolution is easy.',
  visual: 'scope', keywords: ['divisions', 'volts per division', 'time base', 'frequency from scope'],
  modes: [
    mode({
      id: 'V', label: 'Find Vpp', inputs: ['divV', 'Vdiv', 'probe'], outputs: ['Vpp'], equation: 'Vpp = divisions × V/div × probe',
      compute: (v) => ({ Vpp: v.divV * v.Vdiv * v.probe }),
      steps: (v, o) => [`Vpp = ${N(v.divV)} div × ${S('voltage', v.Vdiv)}/div × ${N(v.probe)}`, `Vpp = ${S('voltage', o.Vpp)} (peak ≈ half: ${S('voltage', o.Vpp / 2)})`],
      examples: [ex('3.2 div at 0.5 V/div, ×10 probe', { divV: 3.2, Vdiv: 0.5, probe: 10 }, { Vpp: 16 })],
    }),
    mode({
      id: 't', label: 'Find period & frequency', inputs: ['divT', 'tdiv'], outputs: ['T', 'f'], equation: 'T = divisions × s/div · f = 1 / T',
      compute: (v) => { const T = v.divT * v.tdiv; return { T, f: 1 / T } },
      steps: (v, o) => [`T = ${N(v.divT)} div × ${S('time', v.tdiv)}/div = ${S('time', o.T)}`, `f = 1 / T = 1 / ${S('time', o.T)} = ${S('frequency', o.f)}`],
      examples: [ex('4 div at 250 µs/div', { divT: 4, tdiv: 250 * micro }, { T: 1e-3, f: 1000 })],
    }),
  ],
})

export const riseTimeBandwidth = defineFormula({
  id: 'rise-time-bandwidth', title: 'Rise time and scope bandwidth',
  equation: 'tr ≈ 0.35 / BW · tr,signal = √(tr,measured² − tr,scope²)',
  meaning: 'A scope can’t show an edge faster than its own rise time, which follows from its bandwidth. The edge you see is a mix of the signal’s rise time and the scope’s.',
  fields: [
    field('BW', 'BW', 'Scope bandwidth', 'frequency', { sign: 'pos', description: 'printed on the front, e.g. 50 MHz, 100 MHz' }),
    field('tr', 'tr', 'Rise time (10 % → 90 %)', 'time', { sign: 'pos' }),
    field('trm', 'tr,measured', 'Rise time on the screen', 'time', { sign: 'pos' }),
    field('trs', 'tr,signal', 'Real rise time of the signal', 'time'),
  ],
  unitsNote: 'Rule of thumb: pick a scope whose bandwidth is 3–5× the highest frequency you care about (for a square wave, at least 5× its frequency).',
  visual: 'rise-time', keywords: ['bandwidth', 'rise time', '0.35'],
  modes: [
    mode({
      id: 'tr', label: 'Scope rise time', inputs: ['BW'], outputs: ['tr'], equation: 'tr = 0.35 / BW',
      compute: (v) => ({ tr: 0.35 / v.BW }),
      steps: (v, o) => [`tr = 0.35 / BW = 0.35 / ${S('frequency', v.BW)}`, `tr = ${S('time', o.tr)} — edges faster than this look like this`],
      examples: [ex('100 MHz scope', { BW: 100 * mega }, { tr: 3.5 * nano })],
    }),
    mode({
      id: 'BW', label: 'Bandwidth needed', inputs: ['tr'], outputs: ['BW'], equation: 'BW = 0.35 / tr',
      compute: (v) => ({ BW: 0.35 / v.tr }),
      warn: (_v, o) => [`For an accurate picture choose about 3× more: ${S('frequency', 3 * o.BW)} or higher.`],
      steps: (v, o) => [`BW = 0.35 / tr = 0.35 / ${S('time', v.tr)}`, `BW = ${S('frequency', o.BW)}`],
      examples: [ex('1 ns edge', { tr: nano }, { BW: 350 * mega })],
    }),
    mode({
      id: 'true', label: 'Correct a measured edge', inputs: ['trm', 'BW'], outputs: ['trs'], equation: 'tr,signal = √(tr,measured² − (0.35 / BW)²)',
      check: (v) => (v.trm > 0.35 / v.BW ? undefined : 'The measured edge is not slower than the scope’s own rise time (0.35 / BW): the scope is too slow to measure this edge.'),
      compute: (v) => ({ trs: Math.sqrt(v.trm ** 2 - (0.35 / v.BW) ** 2) }),
      warn: (v) => (v.trm < 3 * (0.35 / v.BW) ? ['The measured edge is less than 3× the scope’s rise time, so the correction is approximate. Use a faster scope for a reliable number.'] : []),
      steps: (v, o) => [`Scope rise time = 0.35 / ${S('frequency', v.BW)} = ${S('time', 0.35 / v.BW)}`, `Rise times add like the sides of a right triangle: tr,signal = √(${S('time', v.trm)}² − ${S('time', 0.35 / v.BW)}²)`, `tr,signal = ${S('time', o.trs)}`],
      examples: [ex('5 ns on a 100 MHz scope', { trm: 5 * nano, BW: 100 * mega }, { trs: Math.sqrt(25 - 12.25) * nano })],
    }),
  ],
})

export const logicAnalyser = defineFormula({
  id: 'logic-analyser', title: 'Using a logic analyser',
  equation: 'sample rate ≥ 4 × fastest signal',
  meaning: 'A logic analyser records many digital lines at once as 1s and 0s. It shows their timing over a long time and decodes protocols such as UART, I²C and SPI into readable bytes.',
  fields: [], unitsNote: '', modes: [], visual: 'logic-analyser', keywords: ['logic analyzer', 'protocol decoder', 'i2c', 'spi', 'uart', 'pulseview', 'sigrok'],
  article: [
    {
      heading: 'Connecting it',
      bullets: [
        'Connect GND to the circuit’s ground first.',
        'One channel per signal (e.g. SCL and SDA for I²C; TX for UART; CLK, MOSI, MISO, CS for SPI).',
        'Check the input voltage limit — many cheap analysers accept 0–5 V only — and set the logic threshold for 1.8, 3.3 or 5 V logic if the software allows.',
      ],
    },
    {
      heading: 'Settings',
      bullets: [
        'Sample rate: at least 4×, better 10×, the fastest signal (bit rate or clock).',
        'Number of samples = sample rate × capture time — more samples need more memory.',
        'Trigger on an edge of one channel (e.g. CS going low) to catch the moment you care about.',
        'Add a protocol decoder and set its options (baud rate, address bits) to see bytes instead of edges.',
      ],
    },
    {
      heading: 'Scope or logic analyser?',
      table: [
        ['Question', 'Use'],
        ['Is the voltage right? Is there noise or ringing?', 'Oscilloscope'],
        ['How fast is the edge?', 'Oscilloscope'],
        ['What bytes are sent on I²C / SPI / UART?', 'Logic analyser'],
        ['Timing between 4–16 digital lines', 'Logic analyser'],
        ['Capture seconds of traffic', 'Logic analyser'],
      ],
    },
  ],
})

export const logicLevels = defineFormula({
  id: 'logic-levels', title: 'Logic levels and noise margins',
  equation: 'NMH = VOH − VIH · NML = VIL − VOL',
  meaning: 'A driver guarantees its output is above VOH when high and below VOL when low. A receiver guarantees to read “high” above VIH and “low” below VIL. Both gaps (noise margins) must be positive for the two chips to talk reliably.',
  fields: [
    field('VOH', 'VOH', 'Driver output high (minimum)', 'voltage', { sign: 'nonneg' }),
    field('VOL', 'VOL', 'Driver output low (maximum)', 'voltage', { sign: 'nonneg' }),
    field('VIH', 'VIH', 'Receiver input high (minimum)', 'voltage', { sign: 'nonneg' }),
    field('VIL', 'VIL', 'Receiver input low (maximum)', 'voltage', { sign: 'nonneg' }),
    field('NMH', 'NMH', 'High noise margin', 'voltage'),
    field('NML', 'NML', 'Low noise margin', 'voltage'),
  ],
  unitsNote: 'Take the four values from the datasheets (“DC characteristics”), at your supply voltage and load current.',
  visual: 'logic-levels', keywords: ['3.3 v', '5 v', 'level shifter', 'ttl', 'cmos', 'compatibility'],
  reference: {
    rows: [
      ['5 V TTL (74LS)', 'VOH ≥ 2.7 V · VOL ≤ 0.5 V · VIH 2.0 V · VIL 0.8 V'],
      ['5 V CMOS (74HC at 5 V)', 'VOH ≈ 4.4 V · VOL ≈ 0.1 V · VIH 3.5 V · VIL 1.5 V'],
      ['5 V, TTL inputs (74HCT)', 'VOH ≈ 4.4 V · VOL ≈ 0.1 V · VIH 2.0 V · VIL 0.8 V'],
      ['3.3 V LVCMOS (most MCUs)', 'VOH ≈ 2.4–2.9 V · VOL ≤ 0.4 V · VIH 2.0 V · VIL 0.8 V'],
    ],
    note: 'Typical values — always check the datasheet. An input must also be tolerant of the voltage it receives (a 3.3 V pin may be damaged by 5 V).',
  },
  modes: [mode({
    id: 'nm', label: 'Noise margins', inputs: ['VOH', 'VOL', 'VIH', 'VIL'], outputs: ['NMH', 'NML'], equation: 'NMH = VOH − VIH · NML = VIL − VOL',
    check: (v) => (v.VOH <= v.VOL ? 'VOH must be higher than VOL.' : v.VIH < v.VIL ? 'VIH must be at least VIL.' : undefined),
    compute: (v) => ({ NMH: v.VOH - v.VIH, NML: v.VIL - v.VOL }),
    warn: (_v, o) => {
      const out: string[] = []
      if (o.NMH < 0) out.push('High level not guaranteed: the receiver may not see a “1”. Use a level shifter, or a receiver with TTL-compatible inputs (e.g. 74HCT).')
      if (o.NML < 0) out.push('Low level not guaranteed: the receiver may not see a “0”. Use a level shifter.')
      if (!out.length) out.push('Both margins are positive: these parts are compatible.')
      return out
    },
    steps: (v, o) => [`NMH = VOH − VIH = ${S('voltage', v.VOH)} − ${S('voltage', v.VIH)} = ${S('voltage', o.NMH)}`, `NML = VIL − VOL = ${S('voltage', v.VIL)} − ${S('voltage', v.VOL)} = ${S('voltage', o.NML)}`, 'Both must be positive; the bigger they are, the more noise the link can take.'],
    examples: [
      ex('3.3 V output into a 5 V TTL input', { VOH: 2.4, VOL: 0.4, VIH: 2.0, VIL: 0.8 }, { NMH: 0.4, NML: 0.4 }),
      ex('3.3 V output into a 74HC at 5 V', { VOH: 2.4, VOL: 0.4, VIH: 3.5, VIL: 1.5 }, { NMH: -1.1, NML: 1.1 }),
    ],
  })],
})

export const analyserSampleRate = defineFormula({
  id: 'analyser-sample-rate', title: 'Logic analyser sample rate and memory',
  equation: 'fs = k × f · samples = fs × t',
  meaning: 'The analyser looks at each line only at its sample points. Take several samples per bit (k ≥ 4) or short pulses slip between them; the faster you sample, the more memory a capture needs.',
  fields: [
    field('f', 'f', 'Fastest signal', 'frequency', { sign: 'pos', description: 'clock frequency or bit rate (e.g. 400 kHz for fast I²C, 115 200 for UART)' }),
    field('k', 'k', 'Samples per bit', 'ratio', { sign: 'pos', min: 1, description: 'at least 4, ideally 10', presets: [{ label: '4× (minimum)', value: 4 }, { label: '10× (comfortable)', value: 10 }] }),
    field('T', 't', 'Capture time', 'time', { sign: 'pos' }),
    field('fs', 'fs', 'Sample rate', 'frequency', { sign: 'pos' }),
    field('N', 'samples', 'Number of samples', 'count', { sign: 'pos' }),
  ],
  unitsNote: 'Sample rates are written as S/s or Hz: 24 MS/s = 24 MHz. Many USB analysers stream to the PC, so the limit is the USB link rather than on-board memory.',
  visual: 'sample-rate', keywords: ['sample rate', 'oversampling', 'memory depth', 'capture'],
  modes: [
    mode({
      id: 'fs', label: 'Sample rate & samples', inputs: ['f', 'k', 'T'], outputs: ['fs', 'N'], equation: 'fs = k × f · samples = fs × t',
      compute: (v) => { const fs = v.k * v.f; return { fs, N: fs * v.T } },
      warn: (v) => (v.k < 4 ? ['Fewer than 4 samples per bit: edges are uncertain by a big part of a bit and short glitches can be missed. Use 4× or more.'] : []),
      steps: (v, o) => [`fs = k × f = ${N(v.k)} × ${S('frequency', v.f)} = ${S('frequency', o.fs)}`, `samples = fs × t = ${N(o.fs)} × ${S('time', v.T)} = ${N(o.N)}`],
      examples: [ex('fast I²C (400 kHz), 4×, 0.5 s', { f: 400 * kilo, k: 4, T: 0.5 }, { fs: 1.6 * mega, N: 800000 })],
    }),
    mode({
      id: 'T', label: 'Longest capture', inputs: ['fs', 'N'], outputs: ['T'], equation: 't = samples / fs',
      compute: (v) => ({ T: v.N / v.fs }),
      steps: (v, o) => [`t = samples / fs = ${N(v.N)} / ${S('frequency', v.fs)}`, `t = ${S('time', o.T)}`],
      examples: [ex('1 M samples at 24 MS/s', { fs: 24 * mega, N: 1e6 }, { T: 1 / 24 })],
    }),
  ],
})

export const signalPages = [signalsExplained, waveformValues, oscilloscope, scopeReading, riseTimeBandwidth, logicAnalyser, logicLevels, analyserSampleRate]
