import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { shareGuildInviteLink, hapticImpact, hapticSuccess, hapticError } from '@/lib/telegram'

const ROLE_LABELS: Record<string, string> = {
  leader: 'Лидер',
  officer: 'Офицер',
  member: 'Участник',
}

export function GuildPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const [guild, setGuild] = useState(getGuildInfo())
  const [messages, setMessages] = useState(getGuildChatMessages())
  const [members, setMembers] = useState(player ? getGuildMembers(player.telegramId) : [])
  const [text, setText] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [newGuildName, setNewGuildName] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isLeader = player ? isGuildLeader(player.telegramId) : false

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    if (!player) return
    const refresh = () => {
      setGuild(getGuildInfo())
      setMessages(getGuildChatMessages())
      setMembers(getGuildMembers(player.telegramId))
    }
    refresh()
    const t = setInterval(refresh, 2000)
    return () => clearInterval(t)
  }, [player])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!player) return null

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

  return (
    <div className="h-full flex flex-col page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Гильдия</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Card className="mx-4 mt-4">
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
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full"
              onClick={() => void shareGuildInviteLink(player.referralCode)}
            >
              Пригласить в гильдию
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Участники онлайн</h3>
          {members.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Пока только вы в сети. Откройте игру в другой вкладке для теста.</p>
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
        </div>

        <div className="px-4 pb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Чат гильдии</h3>
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
        </div>
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
