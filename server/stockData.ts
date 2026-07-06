export type StockVolatility = 'very_low' | 'low' | 'medium' | 'high'

export interface StockSymbolDef {
  id: string
  nameRu: string
  descriptionRu: string
  icon: string
  basePrice: number
  dividendMin: number
  dividendMax: number
  volatility: StockVolatility
}

export const STOCK_SYMBOLS: StockSymbolDef[] = [
  { id: 'aether_mining', nameRu: 'Aether Mining', descriptionRu: 'Добыча ресурсов', icon: '⛏️', basePrice: 10_200, dividendMin: 0.008, dividendMax: 0.012, volatility: 'medium' },
  { id: 'bladeforge', nameRu: 'BladeForge Inc.', descriptionRu: 'Кузнечное дело и крафт', icon: '🔨', basePrice: 10_850, dividendMin: 0.01, dividendMax: 0.015, volatility: 'high' },
  { id: 'tower_defense', nameRu: 'Tower Defense Corp.', descriptionRu: 'Защита этажей', icon: '🏰', basePrice: 9_800, dividendMin: 0.006, dividendMax: 0.01, volatility: 'low' },
  { id: 'mystic_herbs', nameRu: 'Mystic Herbs', descriptionRu: 'Алхимия и травы', icon: '🌿', basePrice: 10_400, dividendMin: 0.009, dividendMax: 0.014, volatility: 'medium' },
  { id: 'sky_realestate', nameRu: 'Sky Real Estate', descriptionRu: 'Недвижимость', icon: '🏠', basePrice: 11_200, dividendMin: 0.012, dividendMax: 0.018, volatility: 'high' },
  { id: 'etherium_guild', nameRu: 'Etherium Guild', descriptionRu: 'Гильдии и социалка', icon: '🛡️', basePrice: 10_100, dividendMin: 0.007, dividendMax: 0.011, volatility: 'low' },
  { id: 'legendary_gear', nameRu: 'Legendary Gear', descriptionRu: 'Легендарное снаряжение', icon: '⚔️', basePrice: 10_950, dividendMin: 0.011, dividendMax: 0.016, volatility: 'high' },
  { id: 'pet_paradise', nameRu: 'Pet Paradise', descriptionRu: 'Питомцы', icon: '🐾', basePrice: 10_300, dividendMin: 0.008, dividendMax: 0.013, volatility: 'medium' },
  { id: 'boss_hunter', nameRu: 'Boss Hunter Union', descriptionRu: 'Охота на боссов', icon: '👹', basePrice: 10_700, dividendMin: 0.01, dividendMax: 0.017, volatility: 'high' },
  { id: 'golden_vault', nameRu: 'Golden Vault', descriptionRu: 'Стабильный банк', icon: '🏦', basePrice: 9_500, dividendMin: 0.005, dividendMax: 0.009, volatility: 'very_low' },
]

export const VOLATILITY_SWING: Record<StockVolatility, [number, number]> = {
  very_low: [0.03, 0.05],
  low: [0.04, 0.06],
  medium: [0.05, 0.07],
  high: [0.06, 0.08],
}
