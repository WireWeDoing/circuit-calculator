import type { Section } from '../core/types.ts'

/** hero = formula whose diagram is the section's picture on the home page */
export const SECTIONS: Section[] = [
  { id: 's0', hero: 'units-and-prefixes', number: '0', title: 'Units, Prefixes & Conversions', blurb: 'Read this first: convert to base units before you calculate.' },
  { id: 's1', hero: 'ohms-law', number: '1', title: "Ohm's Law & Power", blurb: 'Voltage, current, resistance and the heat they make.' },
  { id: 's2', hero: 'voltage-divider', number: '2', title: 'Resistors', blurb: 'Series, parallel, dividers and the colour code.' },
  { id: 's3', hero: 'rc-charging', number: '3', title: 'Capacitors', blurb: 'Storing charge, AC behaviour and RC timing.' },
  { id: 's4', hero: 'induced-voltage', number: '4', title: 'Inductors', blurb: 'Magnetic energy, reactance and switching spikes.' },
  { id: 's5', hero: 'resonant-frequency', number: '5', title: 'Resonance & Filters', blurb: 'Tuned circuits, Q factor and cutoff frequencies.' },
  { id: 's6', hero: 'led-resistor', number: '6', title: 'Diodes & LEDs', blurb: 'Forward drops and the LED series resistor.' },
  { id: 's7', hero: 'bjt-gain', number: '7', title: 'BJT Transistors', blurb: 'Gain, base resistor and power dissipation.' },
  { id: 's8', hero: 'mosfet-power', number: '8', title: 'MOSFETs', blurb: 'Threshold, conduction loss and gate drive.' },
  { id: 's9', hero: 'impedance-magnitude', number: '9', title: 'AC & Impedance', blurb: 'Impedance, phase and RMS / peak values.' },
  { id: 's10', hero: '555-astable-frequency', number: '10', title: '555 Timer', blurb: 'Astable frequency, duty cycle and one-shot pulses.' },
  { id: 's11', hero: 'db-power', number: '11', title: 'Decibels, Wavelength & Period', blurb: 'Ratios in dB, wave length, frequency vs period.' },
  { id: 's12', hero: 'kvl', number: '12', title: 'Wires, Circuits & General Laws', blurb: 'Cable resistance, Kirchhoff and power factor.' },
  { id: 's13', hero: 'adc-reading', number: '13', title: 'Microcontrollers & Digital Circuits', blurb: 'ADC, PWM, UART, I²C and crystal caps.' },
  { id: 's14', hero: 'microstrip-z0', number: '14', title: 'PCB Layout & Signal Integrity', blurb: 'Trace current, impedance, delay and skin depth.' },
  { id: 's15', hero: 'battery-energy', number: '15', title: 'Batteries & Power Storage', blurb: 'Capacity, C-rate, runtime and voltage sag.' },
  { id: 's16', hero: 'vswr', number: '16', title: 'RF & Antennas', blurb: 'Antenna length, path loss, VSWR and dBm.' },
  { id: 's17', hero: 'p8-wheatstone', groups: [
    { id: 'g17-method', title: 'Method & reverse formulas' },
    { id: 'g17-1', title: '17.1 Resistor networks' },
    { id: 'g17-2', title: '17.2 Voltage dividers, sensors and bridges' },
    { id: 'g17-3', title: '17.3 Capacitors, inductors and timing' },
    { id: 'g17-4', title: '17.4 LEDs, Zener diodes and power supplies' },
    { id: 'g17-5', title: '17.5 Transistor circuits' },
    { id: 'g17-6', title: '17.6 Batteries and sources' },
  ], number: '17', title: 'Solving Circuits', blurb: 'Find unknown values: 21 guided problems with step-by-step methods.' },
]
