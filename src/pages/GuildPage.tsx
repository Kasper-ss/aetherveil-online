import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Pencil, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { usePlayerStore } from '@/store/playerStore'
import {
  GUILD_MAX_MEMBERS,
  getGuildMembers,
  getGuildChatMessages,
  sendGuildChatMessage,
  getGuildInfo,
  isGuildLeader,
  renameGuild,
} from '@/lib/multiplayer'
import { getGuildQuestProgress } from '@/lib/multiplayer'
import { GUILD_QUESTS } from '@/data/quests'
import { isQuestClaimed, normalizeQuestState } from '@/lib/quests'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { shareGuildInviteLink, hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram'
import { ItemSummary } from '@/components/ui/ItemSummary'
import type { Item } from '@/types/game'

const ROLE_LABELS: Record<string, string> = {
  leader: 'Лидер',
  officer: 'Офицер',
  member: 'Участник',
}

export function GuildPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const invitePlayerToGuild = usePlayerStore((s) => s.invitePlayerToGuild)
  const acceptGuildInvite = usePlayerStore((s) => s.acceptGuildInvite)
  const declineGuildInvite = usePlayerStore((s) => s.declineGuildInvite)
  const getPendingGuildInvites = usePlayerStore((s) => s.getPendingGuildInvites)
  const sendGuildGift = usePlayerStore((s) => s.sendGuildGift)
  const claimQuestReward = usePlayerStore((s) => s.claimQuestReward)

  const [guild, setGuild] = useState(getGuildInfo())
  const [messages, setMessages] = useState(getGuildChatMessages())
  const [members, setMembers] = useState(player ? getGuildMembers(player.telegramId, player.displayName, player.username) : [])
  const [text, setText] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [newGuildName, setNewGuildName] = useState('')
  const [inviteId, setInviteId] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [giftTarget, setGiftTarget] = useState<number | null>(null)
  const [selectedGift, setSelectedGift] = useState<Item | null>(null)
  const [sendingGift, setSendingGift] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isLeader = player ? isGuildLeader(player.telegramId) : false
  const pendingInvites = player ? getPendingGuildInvites() : []
  const guildProgress = getGuildQuestProgress()
  const questState = player ? normalizeQuestState(player) : null

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    if (!player) return
    const refresh = () => {
      setGuild(getGuildInfo())
      setMessages(getGuildChatMessages())
      setMembers(getGuildMembers(player.telegramId, player.displayName, player.username))
    }
    refresh()
    const t = setInterval(refresh, 2000)
    return () => clearInterval(t)
  }, [player])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!player) return null

  const giftableItems = player.inventory.filter((i) => i.slot !== 'consumable')

  function handleSend() {
    if (!text.trim()) return
    sendGuildChatMessage(player!.telegramId, player!.displayName, text)
    setText('')
    setMessages(getGuildChatMessages())
    hapticImpact('light')
  }

  function handleRenameGuild() {
    if (renameGuild(player!.telegramId, newGuildName)) {
      setGuild(getGuildInfo())
      setShowRename(false)
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  function handleInviteById() {
    const id = Math.floor(Number(inviteId.trim()))
    if (!id) { hapticError(); setInviteMsg('Введите корректный ID'); return }
    if (invitePlayerToGuild(id)) {
      hapticSuccess()
      setInviteMsg(`Приглашение отправлено игроку #${id}`)
      setInviteId('')
    } else {
      hapticError()
      setInviteMsg('Не удалось пригласить (лимит, уже в гильдии или нет прав)')
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

  return (
    <div className="h-full flex flex-col page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Гильдия</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {pendingInvites.length > 0 && (
          <Card className="mb-3 border-aether-cyan/40">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs text-aether-cyan font-medium">Приглашения в гильдию</p>
              {pendingInvites.map((inv) => (
                <div key={inv.guildId} className="flex items-center gap-2">
                  <div className="flex-1 text-xs text-slate-300">
                    «{inv.guildName}» от {inv.fromName}
                  </div>
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => {
                    if (acceptGuildInvite(inv.guildId)) hapticSuccess()
                    else hapticError()
                  }}>Вступить</Button>
                  <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={() => declineGuildInvite(inv.guildId)}>
                    Отклонить
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mb-3">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">[{guild.tag}] {guild.name}</CardTitle>
              <Badge>Ур.{guild.level}</Badge>
              {isLeader && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={() => { setNewGuildName(guild.name); setShowRename(true) }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400">{guild.description}</p>
            <p className="text-[10px] text-aether-cyan mt-1">
              Участников: {members.length}/{GUILD_MAX_MEMBERS}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <Button variant="secondary" size="sm" className="w-full"
              onClick={() => void shareGuildInviteLink(player.referralCode)}
            >
              Поделиться ссылкой
            </Button>
            {isLeader && (
              <div className="flex gap-2">
                <input
                  value={inviteId}
                  onChange={(e) => setInviteId(e.target.value)}
                  placeholder="ID игрока"
                  className="flex-1 bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
                />
                <Button size="sm" onClick={handleInviteById}>Пригласить</Button>
              </div>
            )}
            {inviteMsg && <p className="text-[10px] text-slate-500">{inviteMsg}</p>}
          </CardContent>
        </Card>

        <Tabs defaultValue="members">
          <TabsList className="w-full mb-3">
            <TabsTrigger value="members" className="flex-1 text-[10px]">Участники</TabsTrigger>
            <TabsTrigger value="gifts" className="flex-1 text-[10px]">Подарки</TabsTrigger>
            <TabsTrigger value="quests" className="flex-1 text-[10px]">Квесты</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 text-[10px]">Чат</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-2">
            {members.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Пока нет участников в ростере.</p>
            ) : members.map((member) => (
              <Card key={member.telegramId}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-aether-card flex items-center justify-center text-lg">⚔️</div>
                    {member.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-aether-success rounded-full border-2 border-aether-bg" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {member.displayName}
                      <span className="text-slate-500 text-[10px] ml-1">#{member.telegramId}</span>
                      {member.telegramId === player.telegramId && <span className="text-aether-cyan text-xs ml-1">(Вы)</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">Ур.{member.level} · Этаж {member.floor}</div>
                  </div>
                  <Badge variant={member.role === 'leader' ? 'legendary' : member.role === 'officer' ? 'epic' : 'common'}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="gifts" className="space-y-3">
            <p className="text-[10px] text-slate-500">Подарите предмет участнику гильдии. Получатель заберёт его при синхронизации.</p>
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
                  <p className="text-xs text-slate-500">Нет предметов для дарения</p>
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
              Подарить
            </Button>
          </TabsContent>

          <TabsContent value="quests" className="space-y-2">
            {GUILD_QUESTS.map((q) => {
              const progress = guildProgress[q.id] ?? 0
              const claimed = questState ? isQuestClaimed(questState, q.id, 'guild') : false
              return (
                <Card key={q.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">{q.nameRu}</span>
                      <span className="text-aether-cyan">{progress}/{q.target}</span>
                    </div>
                    <Progress value={Math.min(100, (progress / q.target) * 100)} className="mb-2" />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={claimed || progress < q.target}
                      onClick={() => {
                        if (claimQuestReward(q.id, 'guild')) hapticSuccess()
                        else hapticError()
                      }}
                    >
                      {claimed ? 'Получено' : progress >= q.target ? 'Забрать' : 'В процессе'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
            <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/quests')}>
              Все квесты
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Сообщение..."
                    className="flex-1 bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
                    maxLength={200}
                  />
                  <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Название гильдии</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 mb-2">Только лидер может менять название.</p>
          <input
            value={newGuildName}
            onChange={(e) => setNewGuildName(e.target.value)}
            maxLength={30}
            className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-3"
            placeholder="Новое название"
          />
          <Button className="w-full" onClick={handleRenameGuild} disabled={newGuildName.trim().length < 2}>
            Сохранить
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
