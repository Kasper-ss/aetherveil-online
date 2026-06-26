export interface GuildGiftItem {
  id: string
  name: string
  slot: string
  rarity: string
  stats?: Record<string, number>
  icon?: string
  instanceId?: string
  upgradeLevel?: number
  starLevel?: number
  durability?: number
  maxDurability?: number
  [key: string]: unknown
}

export interface QueuedGuildGift {
  id: string
  fromId: number
  fromName: string
  toId: number
  item: GuildGiftItem
  sentAt: string
}

const globalStore = globalThis as typeof globalThis & {
  __aetherveilGuildGifts?: Map<number, QueuedGuildGift[]>
}

function giftQueue(): Map<number, QueuedGuildGift[]> {
  if (!globalStore.__aetherveilGuildGifts) {
    globalStore.__aetherveilGuildGifts = new Map()
  }
  return globalStore.__aetherveilGuildGifts
}

export function queueGuildGift(input: {
  fromId: number
  fromName: string
  toId: number
  item: GuildGiftItem
}): QueuedGuildGift {
  const gift: QueuedGuildGift = {
    id: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fromId: input.fromId,
    fromName: input.fromName,
    toId: input.toId,
    item: input.item,
    sentAt: new Date().toISOString(),
  }
  const queue = giftQueue()
  const list = queue.get(input.toId) ?? []
  list.push(gift)
  queue.set(input.toId, list.slice(-20))
  return gift
}

export function claimGuildGifts(recipientId: number): QueuedGuildGift[] {
  const queue = giftQueue()
  const gifts = queue.get(recipientId) ?? []
  queue.delete(recipientId)
  return gifts
}
