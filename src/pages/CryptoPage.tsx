/**
 * Placeholder UI for future crypto wallet / NFT / on-chain shop.
 * Not routed in App.tsx until FEATURES.cryptoPayments is true.
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FEATURES } from '@/lib/featureFlags'
import { CRYPTO_CONFIG } from '@/lib/crypto/config'

export function CryptoPage() {
  const navigate = useNavigate()

  if (!FEATURES.cryptoPayments) {
    return (
      <div className="h-full overflow-y-auto page-enter p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Крипто</h1>
        </div>
        <Card>
          <CardContent className="p-4 text-sm text-slate-400 space-y-2">
            <p>Раздел в разработке. Здесь появятся кошельки, покупки за TON и NFT-предметы.</p>
            <p className="text-[10px] text-slate-500">
              Сеть по умолчанию: {CRYPTO_CONFIG.defaultChain}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
