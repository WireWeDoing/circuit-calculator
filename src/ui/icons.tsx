import type { ComponentType } from 'react'
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull'
import BoltIcon from '@mui/icons-material/Bolt'
import CableIcon from '@mui/icons-material/Cable'
import CalculateIcon from '@mui/icons-material/Calculate'
import CellTowerIcon from '@mui/icons-material/CellTower'
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import MemoryIcon from '@mui/icons-material/Memory'
import StraightenIcon from '@mui/icons-material/Straighten'
import TimerIcon from '@mui/icons-material/Timer'
import TuneIcon from '@mui/icons-material/Tune'
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon'

/** Line-drawn electronic symbols (MUI ships no resistor / capacitor / transistor icons). */
const Line = (props: SvgIconProps & { children: React.ReactNode }) => {
  const { children, ...rest } = props
  return (
    <SvgIcon {...rest}>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</g>
    </SvgIcon>
  )
}

export const ResistorIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 12h3l2-5 3 10 3-10 3 10 2-5h4" /></Line>
export const CapacitorIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 12h8M14 12h8M10 5v14M14 5v14" /></Line>
export const InductorIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 15h3a3.5 3.5 0 0 1 7 0a3.5 3.5 0 0 1 7 0h3" transform="translate(0 -3)" /></Line>
export const DiodeIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 12h6M16 12h6M8 6l8 6-8 6zM16 6v12" /></Line>
export const TransistorIcon = (p: SvgIconProps) => <Line {...p}><circle cx="13" cy="12" r="8.5" /><path d="M2 12h6M8 7v10M8 10l6-4V3M8 14l6 4v3" /><path d="M14 18l-3-.6M14 18l-.6-3" /></Line>
export const MosfetIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 12h5M7 6v12M10 6.5v3M10 10.5v3M10 14.5v3M10 8h8V3M10 16h8v5M10 12h8" /></Line>
export const SineIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 12c3-9 6-9 8 0s5 9 8 0c.8-2.4 2-3.6 4-3.6" /></Line>

/** The element each top-level section is about (shown only on the parent rows of the sidebar). */
export const SECTION_ICONS: Record<string, ComponentType<SvgIconProps>> = {
  s0: StraightenIcon, // units & prefixes
  s1: BoltIcon, // Ohm's law & power
  s2: ResistorIcon,
  s3: CapacitorIcon,
  s4: InductorIcon,
  s5: TuneIcon, // resonance & filters
  s6: DiodeIcon,
  s7: TransistorIcon,
  s8: MosfetIcon,
  s9: SineIcon, // AC & impedance
  s10: TimerIcon, // 555 timer
  s11: GraphicEqIcon, // dB, wavelength, period
  s12: CableIcon, // wires & general laws
  s13: MemoryIcon, // microcontrollers
  s14: DeveloperBoardIcon, // PCB
  s15: BatteryChargingFullIcon,
  s16: CellTowerIcon, // RF & antennas
  s17: CalculateIcon, // solving circuits
}
