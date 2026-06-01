import { describe, it, expect } from 'vitest'
import {
  kmToDisplay, displayToKm,
  litresToDisplay, displayToLitres,
  distanceLabel, volumeLabel, efficiencyLabel,
  kmplToDisplay,
} from '../units'

describe('units — metric passthrough', () => {
  it('returns km unchanged', () => expect(kmToDisplay(100, 'metric')).toBe(100))
  it('returns litres unchanged', () => expect(litresToDisplay(10, 'metric')).toBe(10))
  it('labels km', () => expect(distanceLabel('metric')).toBe('km'))
  it('labels L', () => expect(volumeLabel('metric')).toBe('L'))
  it('labels km/L', () => expect(efficiencyLabel('metric')).toBe('km/L'))
  it('kmpl unchanged', () => expect(kmplToDisplay(20, 'metric')).toBe(20))
})

describe('units — imperial conversion', () => {
  it('converts 100 km → ~62.1 mi', () => {
    expect(kmToDisplay(100, 'imperial')).toBeCloseTo(62.1, 0)
  })
  it('round-trips km → display → km', () => {
    const display = kmToDisplay(100, 'imperial')
    expect(displayToKm(display, 'imperial')).toBeCloseTo(100, 0)
  })
  it('converts 10 L → ~2.64 gal', () => {
    expect(litresToDisplay(10, 'imperial')).toBeCloseTo(2.64, 1)
  })
  it('round-trips L → display → L', () => {
    const display = litresToDisplay(10, 'imperial')
    expect(displayToLitres(display, 'imperial')).toBeCloseTo(10, 1)
  })
  it('labels mi', () => expect(distanceLabel('imperial')).toBe('mi'))
  it('labels gal', () => expect(volumeLabel('imperial')).toBe('gal'))
  it('labels mpg', () => expect(efficiencyLabel('imperial')).toBe('mpg'))
  it('converts 20 km/L → ~47 mpg', () => {
    expect(kmplToDisplay(20, 'imperial')).toBeCloseTo(47, 0)
  })
})
