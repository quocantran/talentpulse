import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  Building2,
  UserCheck,
  Bell,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  PlusCircle,
  Zap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useToast } from '../../context/ToastContext';
import {
  employerApi,
  type HrDashboardStats,
} from '../../lib/employerApi';

import { DashboardOverviewTab } from './tabs/DashboardOverviewTab';
import { CompanyProfileTab } from './tabs/CompanyProfileTab';
import { JobManagementTab } from './tabs/JobManagementTab';
import { CandidateManagementTab } from './tabs/CandidateManagementTab';
import { CVSearchTab } from './tabs/CVSearchTab';
import { HrAccountTab } from './tabs/HrAccountTab';
import { NotificationsTab } from './tabs/NotificationsTab';

export type EmployerTabType =
  | 'dashboard'
  | 'jobs'
  | 'candidates'
  | 'search-cv'
  | 'company'
  | 'account'
  | 'notifications';

export default function EmployerDashboardPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, accessToken, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<EmployerTabType>(
    (searchParams.get('tab') as EmployerTabType) || 'dashboard',
  );

  const [statsData, setStatsData] = useState<HrDashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);

  // Extra sub-routing state
  const [tabExtraData, setTabExtraData] = useState<{
    filterJobId?: string | null;
    openAiRank?: boolean;
    selectedApplicationId?: string | null;
  }>({});

  const fetchDashboardData = async () => {
    if (!accessToken) return;
    try {
      const data = await employerApi.getDashboardStats(accessToken);
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load HR dashboard stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [accessToken]);

  const handleNavigateTab = (tab: string, extraData?: any) => {
    setActiveTab(tab as EmployerTabType);
    setSearchParams({ tab });
    if (extraData) {
      setTabExtraData(extraData);
    } else {
      setTabExtraData({});
    }
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleOpenCreateJob = () => {
    if (!statsData?.hasCompany || !statsData?.isProfileComplete) {
      info(t('employer.dashboardTab.onboardingTitle', 'Vui lòng hoàn tất hồ sơ doanh nghiệp trước khi đăng tin'));
      handleNavigateTab('company');
      return;
    }
    if (
      statsData?.stats &&
      statsData.stats.todayJobsPostedCount >= statsData.stats.maxDailyJobs
    ) {
      info(
        `${t('employer.jobsTab.todayQuotaUsed')} ${statsData.stats.maxDailyJobs}/${statsData.stats.maxDailyJobs} ${t('employer.sidebar.freeTierDailyJobs')}`,
      );
      return;
    }
    setActiveTab('jobs');
    setIsCreateJobModalOpen(true);
  };

  const unreadNotificationsCount = statsData?.stats?.pendingApplications ?? 0;

  const navItems = [
    {
      id: 'dashboard',
      label: t('employer.sidebar.menuDashboard', 'Dashboard Thống kê'),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'jobs',
      label: t('employer.sidebar.menuJobs', 'Chiến dịch tuyển dụng'),
      icon: Briefcase,
      badge: statsData?.stats?.activeJobs ? `${statsData.stats.activeJobs}` : null,
    },
    {
      id: 'candidates',
      label: t('employer.sidebar.menuCandidates', 'Quản lý CV & Ứng viên'),
      icon: Users,
      badge: statsData?.stats?.pendingApplications ? `${statsData.stats.pendingApplications}` : null,
    },
    {
      id: 'search-cv',
      label: t('employer.sidebar.menuSearchCv', 'Tìm kiếm CV'),
      icon: Search,
      badge: null,
    },
    {
      id: 'company',
      label: t('employer.sidebar.menuCompany', 'Thông tin công ty'),
      icon: Building2,
      badge: !statsData?.isProfileComplete ? t('employer.sidebar.needUpdate', 'Cần cập nhật') : null,
      badgeColor: !statsData?.isProfileComplete ? 'bg-amber-500 text-white' : undefined,
    },
    {
      id: 'account',
      label: t('employer.sidebar.menuAccount', 'Tài khoản HR'),
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'notifications',
      label: t('employer.sidebar.menuNotifications', 'Thông báo'),
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-slate-200/90 bg-slate-900 text-white transition-transform duration-300 ease-in-out dark:border-slate-800 lg:static lg:translate-x-0 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Top: Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white leading-none">
                  {t('employer.sidebar.title', 'TalentPulse')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light mt-0.5">
                  {t('employer.sidebar.portal', 'Employer Portal')}
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar User Profile Card */}
          <div className="p-4 border-b border-slate-800/80">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-800/40 p-4 border border-slate-700/60 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full bg-primary/20 text-primary-light font-bold flex items-center justify-center text-base shrink-0 border border-primary/30 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    (user?.name?.[0] || 'H').toUpperCase()
                  )}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="truncate text-sm font-extrabold text-white">
                      {user?.name || 'HR Manager'}
                    </h4>
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {user?.email}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded-md bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary-light">
                      {t('employer.sidebar.verifiedBadge', 'HR Verified')}
                    </span>
                    <span className="truncate text-[11px] text-slate-400 max-w-[110px]">
                      {statsData?.company?.name || t('employer.sidebar.noCompany', 'Chưa có công ty')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigateTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        item.badgeColor || (isActive ? 'bg-white text-primary' : 'bg-primary/20 text-primary-light')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Bottom: Package Tier & Sign Out */}
          <div className="p-3 border-t border-slate-800/80 space-y-2">
            <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 text-primary-light">
                  <Zap className="h-3.5 w-3.5" />
                  {t('employer.sidebar.freeTierTitle', 'Gói HR Free')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {statsData?.stats?.todayJobsPostedCount ?? 0}/5 {t('employer.sidebar.freeTierDailyJobs', 'tin')}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                {t('employer.sidebar.freeTierDesc', 'Đăng tối đa 5 tin tuyển dụng mỗi ngày')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>{t('employer.sidebar.signOut', 'Đăng xuất HR')}</span>
              </div>
            </button>
          </div>
        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                <span className="hidden sm:inline">{t('employer.header.adminSection', 'Quản trị Tuyển dụng')}</span>
                <ChevronRight className="h-3.5 w-3.5 hidden sm:inline" />
                <span className="font-extrabold text-slate-900 dark:text-white capitalize">
                  {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Post Job CTA */}
              <button
                type="button"
                onClick={handleOpenCreateJob}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('employer.header.postJobBtn', 'Đăng tin')}</span>
              </button>

              {/* Notifications Icon Button */}
              <button
                type="button"
                onClick={() => handleNavigateTab('notifications')}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-xs"
                title={t('employer.sidebar.menuNotifications', 'Thông báo')}
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher variant="dropdown" />

              {/* Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs transition"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </header>


          {/* Body Content */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverviewTab
                data={statsData}
                isLoading={isLoadingStats}
                onNavigateTab={handleNavigateTab}
                onOpenCreateJob={handleOpenCreateJob}
              />
            )}

            {activeTab === 'company' && (
              <CompanyProfileTab
                company={statsData?.company ?? null}
                hasCompany={statsData?.hasCompany ?? false}
                accessToken={accessToken}
                onRefreshData={fetchDashboardData}
              />
            )}

            {activeTab === 'jobs' && (
              <JobManagementTab
                company={statsData?.company ?? null}
                hasCompany={statsData?.hasCompany ?? false}
                isProfileComplete={statsData?.isProfileComplete ?? false}
                accessToken={accessToken}
                todayPostedCount={statsData?.stats?.todayJobsPostedCount ?? 0}
                maxDailyJobs={statsData?.stats?.maxDailyJobs ?? 5}
                onNavigateTab={handleNavigateTab}
                onRefreshStats={fetchDashboardData}
                isCreateModalOpen={isCreateJobModalOpen}
                setIsCreateModalOpen={setIsCreateJobModalOpen}
              />
            )}

            {activeTab === 'candidates' && (
              <CandidateManagementTab
                company={statsData?.company ?? null}
                hasCompany={statsData?.hasCompany ?? false}
                accessToken={accessToken}
                filterJobId={tabExtraData.filterJobId}
                openAiRank={tabExtraData.openAiRank}
                selectedApplicationId={tabExtraData.selectedApplicationId}
                onRefreshStats={fetchDashboardData}
              />
            )}

            {activeTab === 'search-cv' && (
              <CVSearchTab
                accessToken={accessToken}
                onNavigateTab={handleNavigateTab}
              />
            )}


            {activeTab === 'account' && (
              <HrAccountTab
                accessToken={accessToken}
                onRefreshUser={fetchDashboardData}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                accessToken={accessToken}
                onRefreshStats={fetchDashboardData}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
