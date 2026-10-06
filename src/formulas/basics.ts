/* Reference pages for complete beginners (Part 1 of the book). Not in the cheat sheet, so no `section`. */
import { defineFormula } from '../core/define.ts'

export const virExplained = defineFormula({
  id: 'vir-explained', title: 'Voltage, current and resistance explained',
  equation: 'V = I × R',
  meaning: 'Three quantities describe every circuit. Voltage pushes, current flows, resistance holds the flow back. Ohm’s law links them.',
  analogy: 'Water in pipes: voltage is the pressure, current is how much water flows per second, resistance is how narrow the pipe is.',
  fields: [], unitsNote: '', modes: [], visual: 'water', keywords: ['beginner', 'basics', 'what is voltage', 'what is current'],
  article: [
    {
      heading: 'Voltage (V) — the push',
      text: 'Voltage is the difference in electrical “pressure” between two points, measured in volts (V). It is always measured between two points: usually a point in the circuit and ground (0 V).',
      bullets: ['AA cell: 1.5 V', 'USB: 5 V', 'Li-ion cell: 3.7 V (4.2 V full)', 'Car battery: 12 V', 'Mains: 230 V or 120 V AC — dangerous, never touch'],
    },
    {
      heading: 'Current (I) — the flow',
      text: 'Current is how much electric charge passes a point each second, measured in amperes (A). 1 A = 1 coulomb per second. Current only flows around a closed loop: a break anywhere stops it everywhere.',
      bullets: ['Indicator LED: 2–20 mA', 'Microcontroller pin: about 20 mA max', 'Small motor: 100–500 mA', 'Phone charging: 1–3 A'],
    },
    {
      heading: 'Resistance (R) — the brake',
      text: 'Resistance is how strongly a part opposes current, measured in ohms (Ω). A resistor turns the energy it stops into heat.',
      bullets: ['Wire: almost 0 Ω', 'Resistors: from about 1 Ω to 10 MΩ', 'Dry skin: 100 kΩ or more', 'Insulators (plastic, air): too high to measure'],
    },
    {
      heading: 'The quantities at a glance',
      table: [
        ['Quantity', 'Symbol', 'Unit', 'How to get it'],
        ['Voltage', 'V (or U)', 'volt, V', 'meter across the part'],
        ['Current', 'I', 'ampere, A', 'meter in series with the part'],
        ['Resistance', 'R', 'ohm, Ω', 'meter on the part, power off'],
        ['Power', 'P', 'watt, W', 'P = V × I'],
        ['Charge', 'Q', 'coulomb, C', 'Q = I × t'],
      ],
    },
  ],
})

export const schematicSymbols = defineFormula({
  id: 'schematic-symbols', title: 'Reading a schematic',
  equation: 'lines = wires · dot = connection',
  meaning: 'A schematic shows what is connected to what, not where parts sit on the board. Learn the symbols and a few drawing rules and any circuit diagram becomes readable.',
  fields: [], unitsNote: '', modes: [], visual: 'symbols', keywords: ['schematic', 'symbols', 'circuit diagram'],
  article: [
    {
      heading: 'Drawing rules',
      bullets: [
        'A line is a wire with (almost) no resistance: every point on it is at the same voltage.',
        'A dot where lines meet means they are connected. Lines that cross without a dot are not connected.',
        'Every ground symbol is the same node (0 V), even when they are drawn far apart.',
        'Supply rails are often labels instead of wires: +5V, VCC, VDD (positive) and GND, VSS (0 V).',
        'Part labels: R1, C3, U2 (an IC), Q1 (a transistor), D1 (a diode).',
        'Values use the prefix as the decimal point: 4k7 = 4.7 kΩ, 2R2 = 2.2 Ω, 4n7 = 4.7 nF.',
      ],
    },
    {
      heading: 'Symbols to know',
      table: [
        ['Symbol', 'Part', 'Watch out for'],
        ['Zig-zag (US) or rectangle (EU)', 'Resistor', 'No polarity — either way round'],
        ['Two plates', 'Capacitor', 'Curved or marked plate = minus on electrolytics'],
        ['Coil of loops', 'Inductor', 'No polarity'],
        ['Triangle + bar', 'Diode', 'Current flows towards the bar (the stripe on the part)'],
        ['Diode with arrows out', 'LED', 'Long leg = anode (+)'],
        ['Long + short plate', 'Battery / DC source', 'Long plate = +'],
        ['Circle with arrow (BJT) or gate line (MOSFET)', 'Transistor', 'See Part 4'],
      ],
    },
  ],
})

export const breadboard = defineFormula({
  id: 'breadboard', title: 'Breadboard basics',
  equation: 'strip of 5 holes = 1 node',
  meaning: 'A solderless breadboard lets you build and change circuits by pushing wires into holes. Knowing which holes are connected underneath is the whole trick.',
  fields: [], unitsNote: '', modes: [], visual: 'breadboard', keywords: ['breadboard', 'prototype', 'wiring'],
  article: [
    {
      heading: 'What is connected inside',
      bullets: [
        'Each short column of 5 holes is one metal strip: everything plugged into it is connected.',
        'The centre gap separates the two halves: a chip (DIP IC) sits across it so each pin gets its own strip.',
        'The long rails along the edges carry power: red line = +, blue or black line = ground. On some boards the rails are split in the middle — bridge them with a wire.',
      ],
    },
    {
      heading: 'Good habits',
      bullets: [
        'Red wire for +, black for ground: you will find mistakes much faster.',
        'Connect power last, after checking the wiring.',
        'Keep leads short and flat; long loops pick up noise.',
        'Use the multimeter’s continuity beep to check that two points really are connected.',
        'Chips: the notch or dot marks pin 1; pins count anticlockwise seen from the top.',
      ],
    },
    {
      heading: 'Limits',
      bullets: ['About 1 A per contact at most.', 'Neighbouring strips have a few pF of capacitance: fine for audio and slow logic, poor above ~10 MHz.', 'Never use a breadboard for mains voltage.'],
    },
  ],
})

export const benchSafety = defineFormula({
  id: 'bench-safety', title: 'Safety on the bench',
  equation: 'power off before you touch',
  meaning: 'Hobby electronics at 3–12 V is safe for people, but a few things can burn, shock or start a fire. Know them before you start.',
  fields: [], unitsNote: '', modes: [], visual: 'safety', keywords: ['safety', 'mains', 'shock'],
  article: [
    {
      heading: 'Dangerous',
      bullets: [
        'Mains (230 V / 120 V AC) can kill. Don’t open mains-powered devices; use a plug-in adapter or a bench supply.',
        'Large capacitors (power supplies, camera flashes, microwave ovens) stay charged after power-off. Measure the voltage, then discharge through a resistor (e.g. 1 kΩ, 5 W).',
        'Lithium cells shorted or punctured can catch fire. Use protected cells, a fuse and never short the terminals.',
      ],
    },
    {
      heading: 'Burns and eyes',
      bullets: ['Resistors, regulators and transistors can be hot enough to burn: touch carefully or measure.', 'A soldering iron tip is about 350 °C: always put it back in its stand.', 'Clipped leads fly: wear safety glasses when cutting.', 'Electrolytic capacitors connected the wrong way round can burst.'],
    },
    {
      heading: 'Protect the parts',
      bullets: ['Set the bench supply’s current limit before connecting a new circuit (e.g. 100 mA).', 'Power off before you change wiring.', 'Touch a grounded metal object before handling MOSFETs and CMOS chips (static discharge).', 'Double-check polarity: diodes, LEDs, electrolytic capacitors, ICs, batteries.'],
    },
  ],
})

export const multimeter = defineFormula({
  id: 'multimeter', title: 'Using a multimeter',
  equation: 'V across (in parallel) · A in series · Ω with the power off',
  meaning: 'A digital multimeter (DMM) measures voltage, current and resistance, and tests continuity and diodes. How you connect it depends on what you measure.',
  analogy: 'A voltmeter compares the pressure at two points; an ammeter is a flow meter you have to put into the pipe.',
  fields: [], unitsNote: '', modes: [], visual: 'multimeter', keywords: ['dmm', 'meter', 'measure voltage', 'measure current', 'continuity'],
  article: [
    {
      heading: 'Before you measure',
      bullets: [
        'Black lead in COM. Red lead in VΩ (volts, ohms, small currents) — or in the A / 10A jack for large currents.',
        'Choose the function first, then touch the circuit.',
        'Manual-range meter: start at the highest range and step down.',
        'Negative reading = the leads are the other way round. Nothing is broken.',
      ],
    },
    {
      heading: 'Voltage: across the part',
      bullets: [
        'Put the probes on both ends of the part (in parallel), circuit powered.',
        'V⎓ (straight line) is DC; V~ (wave) is AC and shows the RMS value.',
        'The meter has about 10 MΩ input resistance. With high-value resistors this lowers the reading — see Measurement errors.',
      ],
    },
    {
      heading: 'Current: in series',
      bullets: [
        'Break the circuit and let the current flow through the meter.',
        'Never put the meter in amps mode across a battery or supply: that is a short circuit and blows the fuse (or the meter).',
        'The meter’s shunt drops a little voltage (burden voltage), so the current is slightly lower than without it.',
        'Move the red lead back to VΩ afterwards — forgetting it is the classic way to blow the fuse next time.',
      ],
    },
    {
      heading: 'Resistance, continuity and diodes: power off',
      bullets: [
        'Measure resistance only with the power off, ideally with one leg of the part out of the circuit (other parts in parallel change the reading).',
        'Don’t hold both probe tips with your fingers: your body adds a resistance in parallel.',
        'Continuity (🔊): beeps below about 30–50 Ω. Use it to find broken wires and shorts.',
        'Diode test: shows the forward voltage (0.5–0.7 V silicon, 1.8–3 V LED) one way and OL the other way.',
      ],
    },
    {
      heading: 'What the display means',
      table: [
        ['Display', 'Meaning'],
        ['OL or 1.', 'Over range / open circuit'],
        ['V⎓  /  V~', 'DC volts / AC volts (RMS)'],
        ['mV, µA, kΩ, MΩ', 'Prefixes: check the small letters'],
        ['🔊', 'Continuity beeper'],
        ['Hz, %', 'Frequency, duty cycle (some meters)'],
        ['True RMS', 'Correct AC reading for non-sine waveforms'],
      ],
    },
  ],
})

export const basicsPages = [virExplained, schematicSymbols, breadboard, benchSafety, multimeter]
