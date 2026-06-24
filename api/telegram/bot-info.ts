import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBotToken } from '../../server/telegram.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getBotToken()
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = await response.json() as { ok?: boolean; result?: { username?: string } }
    if (!data.ok || !data.result?.username) {
      return res.status(500).json({ error: 'Не удалось получить данные бота' })
    }
    return res.status(200).json({ username: data.result.username })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bot info error'
    return res.status(500).json({ error: message })
  }
}
