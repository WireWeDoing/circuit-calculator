import { memo, useId } from 'react'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import { Row } from './layout.tsx'
import TextField from '@mui/material/TextField'
import type { Field } from '../core/types.ts'
import { toInputText, unitsOf } from '../core/units.ts'

/** test hook: set `inputHooks.onRender` to see which input rows render (tests/performance.test.tsx) */
export const inputHooks: { onRender?: (rowId: string) => void } = {}

export interface Entry { text: string; unit: string }

interface Props {
  field: Field
  entry: Entry
  error?: string
  /** stable identity of this input ("R" or "R:3" for list row 3) — passed back to onChange so the parent needs ONE stable handler */
  rowId: string
  onChange: (rowId: string, e: Entry) => void
  /** accessible label override (used for list items) */
  label?: string
  testId?: string
}

/** One labelled number input with a unit picker. Native select → good on iOS/Android. */
export const QuantityInput = memo(function QuantityInput({ field, entry, error, rowId, onChange, label, testId }: Props) {
  inputHooks.onRender?.(rowId)
  const id = useId()
  const units = unitsOf(field.dim)
  const showUnit = units.length > 1 || units[0]!.label !== ''
  const text = label ?? `${field.symbol} — ${field.name}`
  return (
    <Stack spacing={0.5}>
      <Row gap={1} align="flex-start">
        <TextField
          id={`${id}-v`}
          label={text}
          value={entry.text}
          onChange={(e) => onChange(rowId, { ...entry, text: e.target.value })}
          error={!!error}
          helperText={error ?? field.description ?? ' '}
          fullWidth
          size="medium"
          placeholder={field.placeholder}
          slotProps={{ htmlInput: { inputMode: 'decimal', autoComplete: 'off', 'data-testid': testId ?? `in-${field.key}`, 'aria-invalid': !!error } }}
        />
        {showUnit && (
          <TextField
            select
            label="Unit"
            value={entry.unit}
            onChange={(e) => onChange(rowId, { ...entry, unit: e.target.value })}
            sx={{ minWidth: 104 }}
            slotProps={{ select: { native: true }, htmlInput: { 'aria-label': `Unit for ${field.symbol}`, 'data-testid': `unit-${testId ?? `in-${field.key}`}` } }}
          >
            {units.map((u) => (
              <option key={u.label} value={u.label}>{u.label}</option>
            ))}
          </TextField>
        )}
      </Row>
      {field.presets && (
        <Row gap={1} wrap>
          {field.presets.map((p) => (
            <Chip key={p.label} label={p.label} size="small" variant="outlined" clickable onClick={() => onChange(rowId, { text: toInputText(p.value / (units.find((u) => u.label === entry.unit)?.factor ?? 1)), unit: entry.unit })} />
          ))}
        </Row>
      )}
    </Stack>
  )
})

export { MenuItem }
