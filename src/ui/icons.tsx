import type { ComponentType } from 'react'
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull'
import BoltIcon from '@mui/icons-material/Bolt'
import CableIcon from '@mui/icons-material/Cable'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert'
import CellTowerIcon from '@mui/icons-material/CellTower'
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import MemoryIcon from '@mui/icons-material/Memory'
import PowerIcon from '@mui/icons-material/Power'
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

export const MultimeterIcon = (p: SvgIconProps) => <Line {...p}><path d="M6 2h12v20H6zM8.5 4.5h7v5h-7z" /><circle cx="12" cy="16" r="2.6" /><path d="M12 16l1.5-1.5" /></Line>
export const ScopeIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 4h20v14H2zM7 22h10" /><path d="M4 13c2-6 4-6 6 0s4 6 6 0 3-5 4-3" /></Line>
export const LogicIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 9h4V4h5v5h4V4h7M2 20h6v-5h4v5h3v-5h7" /></Line>
export const SchematicIcon = (p: SvgIconProps) => <Line {...p}><path d="M2 6h5l1.5-3 3 6 3-6 1.5 3h6M4 6v12h16V6M10 18v-4M14 18v-4M8 14h4M12 14h4" /></Line>
export const GaugeIcon = (p: SvgIconProps) => <Line {...p}><path d="M3 18a9 9 0 1 1 18 0M12 18l5-6M3 21h18" /></Line>
export const OpAmpIcon = (p: SvgIconProps) => <Line {...p}><path d="M7 3v18l14-9zM2 8h5M2 16h5M21 12h2M9 8h3M9 16h3M10.5 14.5v3" /></Line>

/** The icon of each part and chapter of the book (sidebar parent rows, home cards, search). */
export const BOOK_ICONS: Record<string, ComponentType<SvgIconProps>> = {
  // parts
  basics: BoltIcon, measurements: MultimeterIcon, signals: SineIcon, components: ResistorIcon, advanced: MemoryIcon,
  // chapters
  units: StraightenIcon, 'voltage-current-resistance': BoltIcon, power: LocalFireDepartmentIcon, schematics: SchematicIcon,
  multimeter: MultimeterIcon, 'measurement-errors': GaugeIcon, 'measuring-sources': BatteryAlertIcon,
  'dc-ac-pulses': SineIcon, oscilloscope: ScopeIcon, 'decibels-wavelength': GraphicEqIcon, 'digital-signals': LogicIcon,
  wires: CableIcon, resistors: ResistorIcon, capacitors: CapacitorIcon, inductors: InductorIcon, 'diodes-leds': DiodeIcon, batteries: BatteryChargingFullIcon,
  bjt: TransistorIcon, mosfets: MosfetIcon, 'timers-ics': TimerIcon,
  microcontrollers: MemoryIcon, 'power-supplies': PowerIcon, 'ac-filters': TuneIcon, 'network-theorems': AccountTreeIcon, pcb: DeveloperBoardIcon, rf: CellTowerIcon,
}
