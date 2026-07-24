import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Users, 
  ClipboardList,
  CalendarDays,
  Database, 
  LogOut, 
  Menu, 
  RotateCcw,
  X
} from 'lucide-react';
import { loadGymState, restoreSessionsToPack, saveGymState } from './utils';
import { GymState, Coach } from './types';
import { cloudApi, cloudSyncEnabled } from './api';

// Import Modular Components
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import MemberManagementScreen from './components/MemberManagementScreen';
import MemberDetailScreen from './components/MemberDetailScreen';
import RecordsScreen, { RecordsTab } from './components/RecordsScreen';
import DataBackupScreen from './components/DataBackupScreen';
import AppointmentsScreen from './components/AppointmentsScreen';
import AttentionScreen from './components/AttentionScreen';

import { 
  LogClassModal, 
  AddMemberModal, 
  LogPaymentModal 
} from './components/QuickActionModals';

export default function App() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentCoach, setCurrentCoach] = useState<Coach>('力王');

  // Main Active view tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'appointments' | 'attention' | 'records' | 'backup'>('dashboard');
  const [recordsTab, setRecordsTab] = useState<RecordsTab>('logs');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // App database state
  const [gymState, setGymState] = useState<GymState>(loadGymState);
  const [cloudReady, setCloudReady] = useState(!cloudSyncEnabled);
  const [cloudError, setCloudError] = useState('');

  // Responsive mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Quick Action Modal states
  const [isLogClassOpen, setIsLogClassOpen] = useState(false);
  const [logClassMemberId, setLogClassMemberId] = useState<string | undefined>();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isLogPaymentOpen, setIsLogPaymentOpen] = useState(false);
  const [paymentMemberId, setPaymentMemberId] = useState<string | undefined>();
  const [pendingUndoLogId, setPendingUndoLogId] = useState<string | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    if (!cloudSyncEnabled) saveGymState(gymState);
  }, [gymState]);

  useEffect(() => {
    if (!cloudSyncEnabled) return;
    let disposed = false;
    cloudApi.bootstrap()
      .then(({ state }) => { if (!disposed) setGymState(state); })
      .catch((error) => { if (!disposed) setCloudError(error instanceof Error ? error.message : '云端数据加载失败。'); })
      .finally(() => { if (!disposed) setCloudReady(true); });
    return () => { disposed = true; };
  }, []);

  // Handle successful login
  const handleLogin = (coach: Coach) => {
    setCurrentCoach(coach);
    setIsLoggedIn(true);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedMemberId(null);
    setActiveTab('dashboard');
  };

  const updateGymState = (newState: GymState) => {
    setGymState(newState);
  };

  const openLogClass = (memberId?: string) => {
    setLogClassMemberId(memberId);
    setIsLogClassOpen(true);
  };

  const closeLogClass = () => {
    setIsLogClassOpen(false);
    setLogClassMemberId(undefined);
  };

  const openLogPayment = (memberId?: string) => {
    setPaymentMemberId(memberId);
    setIsLogPaymentOpen(true);
  };

  const closeLogPayment = () => {
    setIsLogPaymentOpen(false);
    setPaymentMemberId(undefined);
  };

  const openRecords = (tab: RecordsTab) => {
    setRecordsTab(tab);
    setActiveTab('records');
    setSelectedMemberId(null);
  };

  const applyCloudState = async (request: () => Promise<{ state: GymState }>) => {
    const { state } = await request();
    setGymState(state);
  };

  const handleUndoClass = async () => {
    if (!pendingUndoLogId) return;
    const log = gymState.classLogs.find((item) => item.id === pendingUndoLogId);
    if (!log) return;
    const pack = gymState.coursePacks.find((item) => item.id === log.coursePackId);
    if (!pack) {
      window.alert('对应课包不存在，无法自动恢复课时。');
      setPendingUndoLogId(null);
      return;
    }

    if (cloudSyncEnabled) {
      try {
        await applyCloudState(() => cloudApi.undoClass(pendingUndoLogId));
      } catch (error) {
        window.alert(error instanceof Error ? error.message : '撤销消课失败，请稍后重试。');
      }
      setPendingUndoLogId(null);
      return;
    }

    setGymState((current) => ({
      ...current,
      coursePacks: current.coursePacks.map((item) =>
        item.id === pack.id ? restoreSessionsToPack(item, log) : item,
      ),
      classLogs: current.classLogs.filter((item) => item.id !== pendingUndoLogId),
    }));
    setPendingUndoLogId(null);
  };

  const pendingUndoLog = pendingUndoLogId
    ? gymState.classLogs.find((item) => item.id === pendingUndoLogId)
    : undefined;

  if (!cloudReady) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-sm font-semibold text-slate-500">正在加载云端账本...</main>;
  }

  if (cloudError) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-center text-sm font-semibold text-rose-600">{cloudError}</main>;
  }

  // Cloudflare Access protects cloud mode; this choice only identifies the current coach in the ledger.
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} cloudMode={cloudSyncEnabled} />;
  }

  // Sidebar Menu item lists
  const navigationItems = [
    { key: 'dashboard', name: '工作台', icon: Dumbbell },
    { key: 'members', name: '学员', icon: Users },
    { key: 'appointments', name: '预约', icon: CalendarDays },
    { key: 'records', name: '记录', icon: ClipboardList },
    { key: 'backup', name: '数据', icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row relative font-sans">
      
      {/* 1. MOBILE RESPONSIVE HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white p-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Dumbbell className="h-4.5 w-4.5 text-white stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">Fever Plus</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-indigo-50 px-2 py-1 text-sm font-bold text-indigo-700">
            {currentCoach}教练
          </span>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
            aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 2. MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 flex flex-col justify-between bg-white/95 pt-16 backdrop-blur-md md:hidden">
          <nav className="p-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key && !selectedMemberId;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setSelectedMemberId(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-lg border px-4 text-sm font-bold transition-colors ${
                    isActive
                      ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
                      : 'border-transparent bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500">{currentCoach}教练已登录</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        </div>
      )}

      {/* 3. DESKTOP PERMANENT SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-5 md:flex" id="desktop-sidebar">
        
        {/* Brand logo & header */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
              <Dumbbell className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">Fever Plus</h1>
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                力王 & 花花 私教工作室
              </span>
            </div>
          </div>

          {/* Navigation link group */}
          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key && !selectedMemberId;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setSelectedMemberId(null);
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3.5 text-sm font-bold transition-colors ${
                    isActive
                      ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
                      : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  id={`nav-${item.key}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Coach account status footer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-sm text-slate-600">当前教练：<b className="font-black text-indigo-700">{currentCoach}</b></span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            id="nav-logout"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>

      </aside>

      {/* 4. MAIN PANEL CONTENT SECTION */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 overflow-y-auto p-4 md:p-7 lg:p-8">
        
        {/* Render profile detail view specifically if member is selected */}
        {selectedMemberId ? (
          <MemberDetailScreen
            memberId={selectedMemberId}
            state={gymState}
            onBack={() => setSelectedMemberId(null)}
            onUpdateState={updateGymState}
            onUpdateMember={cloudSyncEnabled ? (memberId, member) => applyCloudState(() => cloudApi.updateMember(memberId, member)) : undefined}
            onSaveTrainingPlan={cloudSyncEnabled ? (plan) => applyCloudState(() => cloudApi.savePlan(plan)) : undefined}
            onDeleteTrainingPlan={cloudSyncEnabled ? (planId) => applyCloudState(() => cloudApi.deletePlan(planId)) : undefined}
            onActivateTrainingPlan={cloudSyncEnabled ? (planId) => applyCloudState(() => cloudApi.activatePlan(planId)) : undefined}
            onOpenLogClass={() => openLogClass(selectedMemberId)}
            onOpenLogPayment={() => openLogPayment(selectedMemberId)}
          />
        ) : (
          <>
            {/* Tab Switched Panels */}
            {activeTab === 'dashboard' && (
              <DashboardScreen
                state={gymState}
                onOpenLogClass={() => openLogClass()}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenLogPayment={() => openLogPayment()}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
                onNavigateToRecords={openRecords}
                onOpenAttention={() => setActiveTab('attention')}
                currentCoach={currentCoach}
              />
            )}

            {activeTab === 'members' && (
              <MemberManagementScreen
                state={gymState}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsScreen
                state={gymState}
                currentCoach={currentCoach}
                onUpdateState={updateGymState}
                onCreateAppointment={cloudSyncEnabled ? (appointment) => applyCloudState(() => cloudApi.createAppointment(appointment)) : undefined}
                onCancelAppointment={cloudSyncEnabled ? (appointmentId) => applyCloudState(() => cloudApi.cancelAppointment(appointmentId)) : undefined}
              />
            )}

            {activeTab === 'attention' && (
              <AttentionScreen
                state={gymState}
                onBack={() => setActiveTab('dashboard')}
                onNavigateToMember={(memberId) => setSelectedMemberId(memberId)}
              />
            )}

            {activeTab === 'records' && (
              <RecordsScreen
                state={gymState}
                activeTab={recordsTab}
                onChangeTab={setRecordsTab}
                onOpenLogClass={() => openLogClass()}
                onOpenLogPayment={() => openLogPayment()}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
                onUndoClass={setPendingUndoLogId}
              />
            )}

            {activeTab === 'backup' && (
              <DataBackupScreen
                state={gymState}
                onUpdateState={updateGymState}
                cloudMode={cloudSyncEnabled}
                onImportState={cloudSyncEnabled ? (state) => applyCloudState(() => cloudApi.importState(state)) : undefined}
              />
            )}
          </>
        )}

      </main>

      {/* 5. QUICK ACTION MODAL INSTANCES */}
      <LogClassModal
        isOpen={isLogClassOpen}
        onClose={closeLogClass}
        state={gymState}
        onUpdateState={updateGymState}
        onCreateClass={cloudSyncEnabled ? (log) => applyCloudState(() => cloudApi.createClass(log)) : undefined}
        currentCoach={currentCoach}
        initialMemberId={logClassMemberId}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        state={gymState}
        onUpdateState={updateGymState}
        onCreateMember={cloudSyncEnabled ? (member) => applyCloudState(() => cloudApi.createMember(member)) : undefined}
      />

      <LogPaymentModal
        isOpen={isLogPaymentOpen}
        onClose={closeLogPayment}
        state={gymState}
        onUpdateState={updateGymState}
        onCreatePayment={cloudSyncEnabled ? (payment) => applyCloudState(() => cloudApi.createPayment(payment)) : undefined}
        currentCoach={currentCoach}
        initialMemberId={paymentMemberId}
      />

      {pendingUndoLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="undo-class-title"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <h2 id="undo-class-title" className="text-lg font-bold text-slate-900">撤销这次消课？</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {pendingUndoLog.memberName} 的 {pendingUndoLog.sessionCount} 节课时会退回原课包，这条消课记录会被删除。
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingUndoLogId(null)}
                className="min-h-11 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleUndoClass}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"
              >
                <RotateCcw className="h-4 w-4" />
                确认撤销
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
