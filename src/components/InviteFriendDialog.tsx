import { useState, useEffect } from 'react'
import { Copy, Share2, UserPlus, Gift, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore } from '@/store/playerStore'
import { shareInviteLink, hapticError, hapticSuccess } from '@/lib/telegram'
import { useT } from '@/hooks/useT'
import {
  REFERRAL_SIGNUP_GEMS,
  REFERRAL_SIGNUP_GOLD,
  countActiveReferrals,
  formatReferralGold,
  getReferralUncollectedTotal,
} from '@/data/referrals'

interface InviteFriendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteFriendDialog({ open, onOpenChange }: InviteFriendDialogProps) {
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const addFriendById = usePlayerStore((s) => s.addFriendById)
  const removeFriend = usePlayerStore((s) => s.removeFriend)
  const claimReferralRewards = usePlayerStore((s) => s.claimReferralRewards)
  const syncPlayerState = usePlayerStore((s) => s.syncPlayerState)
  const [friendIdInput, setFriendIdInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)

  if (!player) return null
  const p = player
  const invites = p.referralInvites ?? []
  const earnings = p.referralEarnings ?? { signupGold: 0, milestoneGold: 0, gems: 0, items: 0 }
  const uncollected = p.referralUncollected ?? { gold: 0, gems: 0, items: 0 }
  const activeCount = countActiveReferrals(invites)
  const totalEarned = earnings.signupGold + earnings.milestoneGold
  const hasUncollected = getReferralUncollectedTotal(uncollected) > 0

  useEffect(() => {
    if (open) void syncPlayerState()
  }, [open, syncPlayerState])

  async function copyReferralCode() {
    try {
      await navigator.clipboard.writeText(p.referralCode)
      hapticSuccess()
      setMessage(t('friends.codeCopied'))
      setTimeout(() => setMessage(null), 2000)
    } catch {
      hapticError()
    }
  }

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

  async function handleCollectReferralReward() {
    if (claiming) return
    if (!hasUncollected) {
      setMessage(t('friends.collectReferralRewardEmpty'))
      hapticError()
      setTimeout(() => setMessage(null), 2000)
      return
    }
    setClaiming(true)
    try {
      const ok = await claimReferralRewards()
      if (ok) {
        setMessage(t('friends.collectReferralRewardDone'))
        hapticSuccess()
      } else {
        setMessage(t('friends.collectReferralRewardFailed'))
        hapticError()
      }
      setTimeout(() => setMessage(null), 2500)
    } finally {
      setClaiming(false)
    }
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('friends.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-white flex items-center gap-1">
                <Gift className="h-3.5 w-3.5 text-aether-gold" />
                {t('friends.referralRewardsTitle')}
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1">
                <li>
                  {t('friends.referralSignupReward')}{' '}
                  <span className="text-aether-gold">
                    {formatReferralGold(REFERRAL_SIGNUP_GOLD)} 🪙 + {REFERRAL_SIGNUP_GEMS} 💎
                  </span>
                  {' '}+ редкий предмет
                </li>
                <li>{t('friends.referralMilestoneReward')}</li>
              </ul>
            </CardContent>
          </Card>

          <div className="rounded-lg bg-aether-bg border border-aether-border p-3">
            <p className="text-xs text-slate-400 mb-1">{t('friends.referralCode')}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-aether-gold flex-1">{p.referralCode}</span>
              <Button variant="outline" size="sm" onClick={() => void copyReferralCode()}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="gold" className="w-full" onClick={handleShareInvite}>
            <Share2 className="h-4 w-4" />
            {t('friends.inviteToGame')}
          </Button>

          <Card className={hasUncollected ? 'border-aether-gold/40' : undefined}>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs text-slate-400">{t('friends.referralUncollected')}</p>
              <p className="text-sm text-aether-gold font-medium">
                {formatReferralGold(uncollected.gold)} 🪙
                {uncollected.gems > 0 && ` + ${uncollected.gems} 💎`}
                {uncollected.items > 0 && ` + ${uncollected.items} предм.`}
                {!hasUncollected && <span className="text-slate-500 font-normal"> — 0</span>}
              </p>
              <Button
                variant="gold"
                className="w-full"
                disabled={claiming || !hasUncollected}
                onClick={() => void handleCollectReferralReward()}
              >
                <Gift className="h-4 w-4" />
                {claiming ? '...' : t('friends.collectReferralReward')}
              </Button>
            </CardContent>
          </Card>

          {(activeCount > 0 || totalEarned > 0) && (
            <Card>
              <CardContent className="p-3 space-y-1 text-xs">
                <p className="text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {t('friends.referralStats')}: {activeCount}
                </p>
                {totalEarned > 0 && (
                  <p className="text-aether-cyan">
                    {t('friends.referralEarned')}: {formatReferralGold(totalEarned)} 🪙
                    {earnings.gems > 0 && ` + ${earnings.gems} 💎`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {invites.length > 0 && (
            <div className="rounded-lg bg-aether-bg border border-aether-border p-3">
              <p className="text-xs text-slate-400 mb-2">{t('friends.referralList')} ({invites.length})</p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {invites.map((inv) => (
                  <div key={inv.refereeId} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="text-white truncate">{inv.displayName}</p>
                      <p className="text-slate-500">
                        {formatReferralGold(inv.lifetimeGoldEarned)} 🪙
                        {inv.milestoneCount > 0 && ` · ${inv.milestoneCount}×100К`}
                      </p>
                    </div>
                    <Badge className={inv.activated ? 'bg-green-900/40 text-green-400 text-[9px]' : 'bg-slate-700 text-slate-400 text-[9px]'}>
                      {inv.activated ? t('friends.referralActive') : t('friends.referralPending')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-aether-bg border border-aether-border p-3">
            <p className="text-xs text-slate-400 mb-1">{t('friends.yourId')}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-aether-cyan flex-1">{p.telegramId}</span>
              <Button variant="outline" size="sm" onClick={() => void copyPlayerId()}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

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

          {p.referredBy && (
            <p className="text-[10px] text-center text-slate-500">
              {t('friends.referredBy')}: {p.referredBy}
            </p>
          )}

          {message && <p className="text-xs text-center text-aether-cyan">{message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
