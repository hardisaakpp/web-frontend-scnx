import { describe, expect, it } from 'vitest'
import { extractArticlePricing, formatCurrency, formatPercent } from '@/modules/articulo-scaner/utils/pricing'
import type { ArticleDetailDto } from '@/modules/articulo-scaner/types'

describe('articulo-scaner pricing helpers', () => {
  it('uses avgPrice/price/margin from API pricing block', () => {
    const article = {
      code: 'A1',
      description: 'Articulo',
      pricing: {
        avgPrice: 9.75,
        price: 11.2,
        margin: 12.95
      }
    } satisfies ArticleDetailDto

    const pricing = extractArticlePricing(article)

    expect(pricing).toEqual({
      avgPrice: 9.75,
      price: 11.2,
      margin: 12.95
    })
    expect(formatCurrency(pricing.avgPrice, 'USD')).toBe('$9.75')
    expect(formatPercent(pricing.margin)).toBe('12,95%')
  })

  it('returns null values when backend sends null by permissions', () => {
    const article = {
      code: 'A2',
      description: 'Articulo sin costo',
      pricing: {
        avgPrice: null,
        price: null,
        margin: null
      }
    } satisfies ArticleDetailDto

    const pricing = extractArticlePricing(article)

    expect(pricing).toEqual({
      avgPrice: null,
      price: null,
      margin: null
    })
    expect(formatCurrency(pricing.avgPrice)).toBe('N/A')
    expect(formatCurrency(pricing.price)).toBe('N/A')
    expect(formatPercent(pricing.margin)).toBe('N/A')
  })

  it('computes margin fallback when margin is absent', () => {
    const article = {
      code: 'A3',
      description: 'Articulo sin margin',
      pricing: {
        avgPrice: 10,
        price: 20
      }
    } satisfies ArticleDetailDto

    const pricing = extractArticlePricing(article)

    expect(pricing.avgPrice).toBe(10)
    expect(pricing.price).toBe(20)
    expect(pricing.margin).toBe(50)
    expect(formatPercent(pricing.margin)).toBe('50,00%')
  })
})
