import { memo } from 'react'
import { VISUALS } from '../visuals/index.ts'
import { ThumbContext } from '../visuals/kit.tsx'

/** Small decorative picture of a formula's diagram (empty inputs, no captions) used in lists and cards. Plain element + CSS: lists show up to 25 of these. */
export const Thumb = memo(function Thumb({ visual, id, width = 112 }: { visual: string; id: string; width?: number }) {
  const V = VISUALS[visual]
  if (!V) return null
  return (
    <div aria-hidden="true" data-testid={`thumb-${id}`} className="thumb" style={{ flexBasis: width, width }}>
      <ThumbContext.Provider value={true}>
        <V v={{}} lists={{}} mode="" />
      </ThumbContext.Provider>
    </div>
  )
})
