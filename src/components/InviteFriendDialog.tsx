import { useState } from 'react'
import { Copy, Share2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore } from '@/store/playerStore'
import { shareInviteLink, hapticError, hapticSuccess } from '@/lib/telegram'
import { useT } from '@/hooks/useT'

interface InviteFriendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteFriendDialog({ open, onOpenChange }: InviteFriendDialogProps) {
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const addFriendById = usePlayerStore((s) => s.addFriendById)
  const removeFriend = usePlayerStore((s) => s.removeFriend)
  const [friendIdInput, setFriendIdInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  if (!player) return null
  const p = player

  async function copyPlayerId() {
    try {
      await navigator.clipboard.writeText(String(p.telegramId))
      hapticSuccess()
      setMessage(t('friends.idCopied'))
      setTimeout(() => setMessage(null), 2000)
    } catch {
      hapticError()
    }
  }

  function handleShareInvite() {
    void shareInviteLink(p.referralCode)
    hapticSuccess()
  }

  function handleAddFriend() {
    const id = Math.floor(Number(friendIdInput.trim()))
    if (!Number.isFinite(id) || id <= 0) {
      setMessage(t('friends.invalidId'))
      hapticError()
      return
    }
    if (id === p.telegramId) {
      setMessage(t('friends.cannotAddSelf'))
      hapticError()
      return
    }
    if ((p.friendIds ?? []).includes(id)) {
      setMessage(t('friends.alreadyAdded'))
      hapticError()
      return
    }
    if (addFriendById(id)) {
      setFriendIdInput('')
      setMessage(t('friends.added'))
      hapticSuccess()
      setTimeout(() => setMessage(null), 2000)
    } else {
      setMessage(t('friends.addFailed'))
      hapticError()
    }
  }

  const friends = p.friendIds ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('friends.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-aether-bg border border-aether-border p-3">
            <p className="text-xs text-slate-400 mb-1">{t('friends.yourId')}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-aether-cyan flex-1">{p.telegramId}</span>
              <Button variant="outline" size="sm" onClick={() => void copyPlayerId()}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="gold" className="w-full" onClick={handleShareInvite}>
            <Share2 className="h-4 w-4" />
            {t('friends.inviteToGame')}
          </Button>

          <div className="rounded-lg bg-aether-bg border border-aether-border p-3 space-y-2">
            <p className="text-xs text-slate-400">{t('friends.addById')}</p>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t('friends.idPlaceholder')}
              value={friendIdInput}
              onChange={(e) => setFriendIdInput(e.target.value)}
              className="w-full bg-aether-surface border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
            />
            <Button className="w-full" onClick={handleAddFriend}>
              <UserPlus className="h-4 w-4" />
              {t('friends.add')}
            </Button>
          </div>

          {friends.length > 0 && (
            <div className="rounded-lg bg-aether-bg border border-aether-border p-3">
              <p className="text-xs text-slate-400 mb-2">{t('friends.list')} ({friends.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {friends.map((id) => (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-slate-300">ID {id}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => removeFriend(id)}>
                      {t('friends.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && <p className="text-xs text-center text-aether-cyan">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
