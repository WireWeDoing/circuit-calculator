export interface Concept { id: string; title: string; body: string }

/** Plain-English explanations of the "scary" symbols and operations used in the formulas. */
export const GLOSSARY: Concept[] = [
  { id: 'prefix', title: 'Prefixes (k, m, µ, n, p)', body: 'A prefix is a shorthand multiplier: k = ×1000, m = ÷1000, µ = ÷1 000 000, n = ÷1 000 000 000, p = a million-millionth. 4.7 kΩ = 4700 Ω. Convert to base units (V, A, Ω, F, H, Hz, s, W) before you calculate — this app does it for you and shows the conversion.' },
  { id: 'pi', title: 'π and 2π', body: 'π ≈ 3.1416 is the ratio of a circle\'s circumference to its diameter. AC signals go round a circle once per cycle, so 2π ≈ 6.283 appears whenever frequency f (cycles per second) is turned into radians per second: ω = 2πf.' },
  { id: 'exp', title: 'e (Euler\'s number) and e^x', body: 'e ≈ 2.718 is the base of natural growth/decay. e^(−x) starts at 1 and shrinks smoothly toward 0 — perfect for describing a capacitor charging: fast at first, slower as it fills. On a calculator it is the "eˣ" key.' },
  { id: 'ln', title: 'ln — the natural logarithm', body: 'ln undoes e^x: if e^y = x then y = ln(x). It answers "how many time constants have to pass?". On a calculator it is the "ln" key (not "log").' },
  { id: 'log10', title: 'log₁₀ — the "log" key', body: 'log₁₀(x) asks "10 to what power gives x?". log₁₀(1000) = 3. It squeezes huge ranges into small numbers, which is why decibels use it.' },
  { id: 'db', title: 'Decibels (dB)', body: 'A way to compare two levels with a logarithm. +3 dB ≈ double power, +10 dB = ten times power, −3 dB = half. For voltage or current the numbers double: +6 dB ≈ 2×, +20 dB = 10×. A filter\'s cutoff is where it has lost 3 dB (half the power).' },
  { id: 'tau', title: 'Time constant τ (tau)', body: 'The natural "speed" of an RC or RL circuit: τ = R × C or L / R. After 1τ the change is 63% done; after 5τ it is over 99% done.' },
  { id: 'sqrt', title: 'Square root √', body: '√x is the number that multiplied by itself gives x. √100 = 10. Use the "√" key. Resonance and impedance formulas use it.' },
  { id: 'j', title: 'The imaginary unit j', body: 'j = √−1. Engineers use it to mark "at right angles": a resistor\'s opposition points one way, a coil or capacitor\'s opposition points 90° to it. Z = R + jX just means "R along, X up". The magnitude is |Z| = √(R² + X²).' },
  { id: 'arctan', title: 'arctan (inverse tangent)', body: 'arctan(X/R) gives the angle of a right triangle with sides X and R. It tells how far current and voltage are out of step. Use the "tan⁻¹" key in DEG mode.' },
  { id: 'rms', title: 'RMS, peak, peak-to-peak', body: 'A sine wave swings between +Vpeak and −Vpeak (Vpp = 2 × Vpeak). RMS is the DC voltage that would heat a resistor equally: Vrms = Vpeak / √2 ≈ 0.707 × Vpeak. Mains "230 V" is RMS — its peak is 325 V.' },
  { id: 'ln', title: 'ln — the natural logarithm', body: 'ln undoes e^x. It answers "how many time constants have to pass?". On a calculator it is the "ln" key (not "log").' },
]
const seen = new Set<string>()
export const CONCEPTS: Concept[] = GLOSSARY.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
export const conceptById = (id: string): Concept | undefined => CONCEPTS.find((c) => c.id === id)
