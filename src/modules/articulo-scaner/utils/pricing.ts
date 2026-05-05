import type { ArticleDetailDto } from '../types'

export type ArticlePricing = {
  avgPrice: number | null
  price: number | null
  margin: number | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function parseOptionalNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function hasOwn(record: Record<string, unknown> | null, key: string): boolean {
  return !!record && Object.prototype.hasOwnProperty.call(record, key)
}

export function computeMarginFallback(
  price: number | null,
  avgPrice: number | null
): number {
  if (price != null && avgPrice != null && price > 0) {
    return ((price - avgPrice) / price) * 100
  }
  return 0
}

export function extractArticlePricing(article: ArticleDetailDto | null): ArticlePricing {
  const articleRecord = asRecord(article)
  const pricingRecord = asRecord(articleRecord?.pricing)

  const avgPrice =
    parseOptionalNumber(pricingRecord?.avgPrice) ??
    parseOptionalNumber(articleRecord?.AvgPrice) ??
    parseOptionalNumber(articleRecord?.avgPrice)

  const price =
    parseOptionalNumber(pricingRecord?.price) ??
    parseOptionalNumber(articleRecord?.Price) ??
    parseOptionalNumber(article?.unitPrice) ??
    parseOptionalNumber(articleRecord?.price)

  const hasExplicitMarginField =
    hasOwn(pricingRecord, 'margin') ||
    hasOwn(articleRecord, 'Margin') ||
    hasOwn(articleRecord, 'margin')

  if (hasExplicitMarginField) {
    const explicitMargin =
      parseOptionalNumber(pricingRecord?.margin) ??
      parseOptionalNumber(articleRecord?.Margin) ??
      parseOptionalNumber(articleRecord?.margin)
    return {
      avgPrice,
      price,
      margin: explicitMargin
    }
  }

  return {
    avgPrice,
    price,
    margin: computeMarginFallback(price, avgPrice)
  }
}

export function formatCurrency(value: number | null, currency = 'CLP'): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency || 'CLP',
    maximumFractionDigits: 2
  }).format(value)
}

export function formatPercent(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  return `${new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}%`
}
