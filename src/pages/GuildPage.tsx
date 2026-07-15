import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Gift, Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore } from '@/store/playerStore'
import {
  CREATE_GUILD_COST,
  CREATE_GUILD_MIN_FLOOR,
  fetchMyGuild,
  pollGuildChat,
  sendGuildChatOnServer,
  type ServerGuild,
  type GuildListEntry,
} from '@/lib/guildApi'
import { GUILD_MAX_MEMBERS } from '@/lib/multiplayer'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram'
import { ItemSummary } from '@/components/ui/ItemSummary'
import type { GuildChatMessage, Item } from '@/types/game'

const ROLE_LABELS: Record<string, string> = {
  leader: 'Лидер',
  officer: 'Офицер',
  member: 'Участник',
}

export function GuildPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const createPlayerGuild = usePlayerStore((s) => s.createPlayerGuild)
  const joinPlayerGuild = usePlayerStore((s) => s.joinPlayerGuild)
  const leavePlayerGuild = usePlayerStore((s) => s.leavePlayerGuild)
  const fetchGuildDirectory = usePlayerStore((s) => s.fetchGuildDirectory)
  const sendGuildGift = usePlayerStore((s) => s.sendGuildGift)

  const [guildList, setGuildList] = useState<GuildListEntry[]>([])
  const [myGuild, setMyGuild] = useState<ServerGuild | null>(null)
  const [messages, setMessages] = useState<GuildChatMessage[]>([])
  const [text, setText] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newGuildName, setNewGuildName] = useState('')
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [joinMsg, setJoinMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [giftTarget, setGiftTarget] = useState<number | null>(null)
  const [selectedGift, setSelectedGift] = useState<Item | null>(null)
  const [sendingGift, setSendingGift] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastMsgIdRef = useRef<string | undefined>(undefined)

  useTelegramBackButton(() => navigate('/'), true)

  const inGuild = Boolean(player?.guildId)

  useEffect(() => {
    if (!player) return
    if (!inGuild) {
      void fetchGuildDirectory().then(setGuildList)
      return
    }
    const refreshGuild = async () => {
      const data = await fetchMyGuild()
      if (data?.guild) setMyGuild(data.guild)
    }
    void refreshGuild()
    const t = setInterval(() => void refreshGuild(), 5000)
    return () => clearInterval(t)
  }, [player, inGuild, fetchGuildDirectory])

  useEffect(() => {
    if (!player?.guildId) return
    const poll = async () => {
      const data = await pollGuildChat(lastMsgIdRef.current)
      if (!data?.messages?.length) return
      setMessages((prev) => {
        const merged = [...prev]
        for (const m of data.messages) {
          if (!merged.some((x) => x.id === m.id)) merged.push(m)
        }
        return merged.slice(-80)
      })
      lastMsgIdRef.current = data.messages[data.messages.length - 1]?.id
    }
    void poll()
    const t = setInterval(() => void poll(), 2000)
    return () => clearInterval(t)
  }, [player?.guildId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!player) return null

  const giftableItems = player.inventory.filter((i) => i.slot !== 'consumable')
  const canCreate = player.highestFloor >= CREATE_GUILD_MIN_FLOOR && player.gold >= CREATE_GUILD_COST

  async function handleCreateGuild() {
    const name = newGuildName.trim()
    if (name.length < 2) {
      setCreateMsg('Название слишком короткое')
      hapticError()
      return
    }
    setLoading(true)
    setCreateMsg(null)
    try {
      const res = await createPlayerGuild(name)
      if (res.ok) {
        hapticSuccess()
        setShowCreate(false)
        setNewGuildName('')
        const data = await fetchMyGuild()
        if (data?.guild) setMyGuild(data.guild)
      } else {
        setCreateMsg(res.error ?? 'Ошибка')
        hapticError()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinGuild(guildId: string) {
    setJoinMsg(null)
    setLoading(true)
    try {
      const res = await joinPlayerGuild(guildId)
      if (res.ok) {
        hapticSuccess()
        const data = await fetchMyGuild()
        if (data?.guild) setMyGuild(data.guild)
      } else {
        setJoinMsg(res.error ?? 'Не удалось вступить')
        hapticError()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleLeaveGuild() {
    if (!confirm('Покинуть гильдию?')) return
    const ok = await leavePlayerGuild()
    if (ok) {
      hapticSuccess()
      setMyGuild(null)
      setMessages([])
      lastMsgIdRef.current = undefined
      const list = await fetchGuildDirectory()
      setGuildList(list)
    } else {
      hapticError()
    }
  }

  async function handleSendChat() {
    if (!text.trim()) return
    const res = await sendGuildChatOnServer(text)
    if (res?.message) {
      setMessages((prev) => [...prev, res.message!].slice(-80))
      lastMsgIdRef.current = res.message.id
      setText('')
      hapticImpact('light')
    } else {
      hapticError()
    }
  }

  async function handleSendGift() {
    if (!giftTarget || !selectedGift) return
    setSendingGift(true)
    try {
      const ok = await sendGuildGift(giftTarget, selectedGift)
      if (ok) {
        hapticSuccess()
        setGiftTarget(null)
        setSelectedGift(null)
      } else {
        hapticError()
      }
    } finally {
      setSendingGift(false)
    }
  }

  if (!inGuild) {
    return (
      <div className="h-full flex flex-col page-enter">
        <div className="flex items-center gap-3 p-4 border-b border-aether-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Гильдия</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-slate-400 text-center">
            Вы не состоите в гильдии. Вступите в существующую или создайте свою.
          </p>

          {guildList.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Существующие гильдии</p>
              {guildList.map((g) => (
                <Card key={g.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        [{g.tag}] {g.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Лидер: {g.leaderName} · {g.memberCount}/{g.maxMembers}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={loading || g.memberCount >= g.maxMembers}
                      onClick={() => void handleJoinGuild(g.id)}
                    >
                      Вступить
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">Пока нет созданных гильдий — будьте первым!</p>
          )}

          {joinMsg && <p className="text-xs text-center text-red-400">{joinMsg}</p>}

          <Button
            variant="gold"
            className="w-full h-14 text-base glow-cyan"
            onClick={() => { setShowCreate(true); setCreateMsg(null) }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать гильдию
          </Button>
          <p className="text-[10px] text-center text-slate-500">
            С {CREATE_GUILD_MIN_FLOOR} этажа · {CREATE_GUILD_COST.toLocaleString('ru-RU')} 🪙 · до {GUILD_MAX_MEMBERS} игроков
          </p>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать гильдию</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-slate-400 mb-2">
              Требования: этаж {CREATE_GUILD_MIN_FLOOR}+, {CREATE_GUILD_COST.toLocaleString('ru-RU')} монет.
              Максимум {GUILD_MAX_MEMBERS} участников.
            </p>
            {!canCreate && (
              <p className="text-xs text-amber-400 mb-2">
                {player.highestFloor < CREATE_GUILD_MIN_FLOOR
                  ? `Нужен ${CREATE_GUILD_MIN_FLOOR} этаж (сейчас ${player.highestFloor})`
                  : `Недостаточно золота (нужно ${CREATE_GUILD_COST.toLocaleString('ru-RU')})`}
              </p>
            )}
            <input
              value={newGuildName}
              onChange={(e) => setNewGuildName(e.target.value)}
              maxLength={30}
              className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-3"
              placeholder="Название гильдии"
            />
            {createMsg && <p className="text-xs text-red-400 mb-2">{createMsg}</p>}
            <Button
              className="w-full"
              disabled={loading || !canCreate || newGuildName.trim().length < 2}
              onClick={() => void handleCreateGuild()}
            >
              Создать за {CREATE_GUILD_COST.toLocaleString('ru-RU')} 🪙
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const guild = myGuild
  const members = guild?.members ?? []

  return (
    <div className="h-full flex flex-col page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Гильдия</h1>
        <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => void handleLeaveGuild()}>
          <LogOut className="h-3.5 w-3.5 mr-1" />
          Выйти
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card className="mb-3">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {guild ? `[${guild.tag}] ${guild.name}` : 'Загрузка...'}
              </CardTitle>
            </div>
            <p className="text-[10px] text-aether-cyan mt-1">
              Участников: {members.length}/{GUILD_MAX_MEMBERS}
            </p>
          </CardHeader>
        </Card>

        <Tabs defaultValue="chat">
          <TabsList className="w-full mb-3">
            <TabsTrigger value="members" className="flex-1 text-[10px]">Участники</TabsTrigger>
            <TabsTrigger value="gifts" className="flex-1 text-[10px]">Обмен</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 text-[10px]">Чат</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-2">
            {members.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Загрузка участников...</p>
            ) : members.map((member) => (
              <Card key={member.telegramId}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-aether-card flex items-center justify-center text-lg">⚔️</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {member.displayName}
                      <span className="text-slate-500 text-[10px] ml-1">#{member.telegramId}</span>
                      {member.telegramId === player.telegramId && <span className="text-aether-cyan text-xs ml-1">(Вы)</span>}
                    </div>
                  </div>
                  <Badge variant={member.role === 'leader' ? 'legendary' : member.role === 'officer' ? 'epic' : 'common'}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="gifts" className="space-y-3">
            <p className="text-[10px] text-slate-500">Передайте предмет участнику гильдии. Получатель заберёт его при синхронизации.</p>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Получатель</p>
              <div className="flex flex-wrap gap-1">
                {members.filter((m) => m.telegramId !== player.telegramId).map((m) => (
                  <Button
                    key={m.telegramId}
                    size="sm"
                    variant={giftTarget === m.telegramId ? 'default' : 'secondary'}
                    className="h-7 text-[10px]"
                    onClick={() => setGiftTarget(m.telegramId)}
                  >
                    {m.displayName}
                  </Button>
                ))}
              </div>
            </div>
            {giftTarget && (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {giftableItems.length === 0 ? (
                  <p className="text-xs text-slate-500">Нет предметов для передачи</p>
                ) : giftableItems.map((item) => (
                  <Card
                    key={item.instanceId}
                    className={`cursor-pointer ${selectedGift?.instanceId === item.instanceId ? 'border-aether-cyan' : ''}`}
                    onClick={() => setSelectedGift(item)}
                  >
                    <CardContent className="p-2">
                      <div className="text-xs text-white mb-1">{item.name}</div>
                      <ItemSummary item={item} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Button
              className="w-full"
              disabled={!giftTarget || !selectedGift || sendingGift}
              onClick={() => void handleSendGift()}
            >
              <Gift className="h-4 w-4 mr-1" />
              Передать предмет
            </Button>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardContent className="p-3">
                <div className="h-48 overflow-y-auto space-y-2 mb-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-8">Напишите первое сообщение</p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={`text-xs ${m.senderId === player.telegramId ? 'text-right' : ''}`}>
                      <span className="text-aether-cyan font-medium">{m.senderName}: </span>
                      <span className="text-slate-300">{m.text}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSendChat()}
                    placeholder="Сообщение..."
                    className="flex-1 bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
                    maxLength={200}
                  />
                  <Button size="icon" onClick={() => void handleSendChat()} disabled={!text.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
