import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoadingScreen } from '@/pages/LoadingScreen'
import { TutorialModal } from '@/pages/TutorialModal'
import { DailyRewardModal } from '@/pages/DailyRewardModal'
import { StatDistributionModal } from '@/pages/StatDistributionModal'
import { IdleRewardModal } from '@/pages/IdleRewardModal'
import { ClassSelectModal } from '@/pages/ClassSelectModal'
import { HomePage } from '@/pages/HomePage'
import { TowerPage } from '@/pages/TowerPage'
import { CombatPage } from '@/pages/CombatPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ShopPage } from '@/pages/ShopPage'
import { GuildPage } from '@/pages/GuildPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ArenaPage } from '@/pages/ArenaPage'
import { ProfessionsPage } from '@/pages/ProfessionsPage'
import { ForgePage } from '@/pages/ForgePage'
import { BankPage } from '@/pages/BankPage'
import { FairPage } from '@/pages/FairPage'
import { SkillsPage } from '@/pages/SkillsPage'
import { useTelegramInit, useOnlineHeartbeat, useEnergyRegen } from '@/hooks/useTelegram'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

function AppRoutes() {
  useTelegramInit()
  useOnlineHeartbeat()
  useEnergyRegen()

  return (
    <>
      <LoadingScreen />
      <ClassSelectModal />
      <TutorialModal />
      <DailyRewardModal />
      <StatDistributionModal />
      <IdleRewardModal />

      <div className="h-full min-h-0 bg-aether-bg overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tower" element={<TowerPage />} />
          <Route path="/combat" element={<CombatPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/guild" element={<GuildPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/arena" element={<ArenaPage />} />
          <Route path="/professions" element={<ProfessionsPage />} />
          <Route path="/forge" element={<ForgePage />} />
          <Route path="/bank" element={<BankPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/fair" element={<FairPage />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
