import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoadingScreen } from '@/pages/LoadingScreen'
import { TutorialModal } from '@/pages/TutorialModal'
import { DailyRewardModal } from '@/pages/DailyRewardModal'
import { StatDistributionModal } from '@/pages/StatDistributionModal'
import { IdleRewardModal } from '@/pages/IdleRewardModal'
import { PetRewardModal } from '@/pages/PetRewardModal'
import { ClassSelectModal } from '@/pages/ClassSelectModal'
import { SecondaryClassSelectModal } from '@/pages/SecondaryClassSelectModal'
import { RaceSelectModal } from '@/pages/RaceSelectModal'
import { WelcomeModal } from '@/pages/WelcomeModal'
import { HomePage } from '@/pages/HomePage'
import { TowerPage } from '@/pages/TowerPage'
import { CombatPage } from '@/pages/CombatPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ShopPage } from '@/pages/ShopPage'
import { GuildPage } from '@/pages/GuildPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ProfessionsPage } from '@/pages/ProfessionsPage'
import { ForgePage } from '@/pages/ForgePage'
import { BankPage } from '@/pages/BankPage'
import { FairPage } from '@/pages/FairPage'
import { RealEstatePage } from '@/pages/RealEstatePage'
import { SkillsPage } from '@/pages/SkillsPage'
import { PlayerViewPage } from '@/pages/PlayerViewPage'
import { MinePage } from '@/pages/MinePage'
import { FishingPage } from '@/pages/FishingPage'
import { HuntPage } from '@/pages/HuntPage'
import { GemSitePage } from '@/pages/GemSitePage'
import { AetherPage } from '@/pages/AetherPage'
import { KitchenPage } from '@/pages/KitchenPage'
import { HerbFieldPage } from '@/pages/HerbFieldPage'
import { QuestsPage } from '@/pages/QuestsPage'
import { RaidsPage } from '@/pages/RaidsPage'
import { CityPage } from '@/pages/CityPage'
import { JewelerPage } from '@/pages/JewelerPage'
import { WorldBossPage } from '@/pages/WorldBossPage'
import { NurseryPage } from '@/pages/NurseryPage'
import { ProductionPage } from '@/pages/ProductionPage'
import { ElementalForgePage } from '@/pages/ElementalForgePage'
import { SessionGuard } from '@/components/SessionGuard'
import { TelegramAuthScreen } from '@/components/TelegramAuthScreen'
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
      <SecondaryClassSelectModal />
      <RaceSelectModal />
      <WelcomeModal />
      <TutorialModal />
      <DailyRewardModal />
      <StatDistributionModal />
      <IdleRewardModal />
      <PetRewardModal />

      <SessionGuard />
      <TelegramAuthScreen />

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
          <Route path="/player/:id" element={<PlayerViewPage />} />
          <Route path="/arena" element={<Navigate to="/" replace />} />
          <Route path="/professions" element={<ProfessionsPage />} />
          <Route path="/professions/:professionId" element={<ProfessionsPage />} />
          <Route path="/forge" element={<ForgePage />} />
          <Route path="/bank" element={<BankPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/fair" element={<FairPage />} />
          <Route path="/real-estate" element={<RealEstatePage />} />
          <Route path="/mine" element={<MinePage />} />
          <Route path="/fishing" element={<FishingPage />} />
          <Route path="/hunt" element={<HuntPage />} />
          <Route path="/gems" element={<GemSitePage />} />
          <Route path="/aether" element={<AetherPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/field" element={<HerbFieldPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/world-boss" element={<WorldBossPage />} />
          <Route path="/raids" element={<RaidsPage />} />
          <Route path="/city" element={<CityPage />} />
          <Route path="/jeweler" element={<JewelerPage />} />
          <Route path="/nursery" element={<NurseryPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/elemental-forge" element={<ElementalForgePage />} />
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
