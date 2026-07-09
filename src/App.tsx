import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Users, 
  Layers, 
  ClipboardCheck, 
  DollarSign, 
  Database, 
  LogOut, 
  Menu, 
  X,
  Heart
} from 'lucide-react';
import { loadGymState, saveGymState } from './utils';
import { GymState, Coach } from './types';

// Import Modular Components
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import MemberManagementScreen from './components/MemberManagementScreen';
import MemberDetailScreen from './components/MemberDetailScreen';
import CoursePackScreen from './components/CoursePackScreen';
import ClassLogsScreen from './components/ClassLogsScreen';
import PaymentLogsScreen from './components/PaymentLogsScreen';
import DataBackupScreen from './components/DataBackupScreen';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'packs' | 'logs' | 'payments' | 'backup'>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // App database state
  const [gymState, setGymState] = useState<GymState>(loadGymState);

  // Responsive mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Quick Action Modal states
  const [isLogClassOpen, setIsLogClassOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isLogPaymentOpen, setIsLogPaymentOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveGymState(gymState);
  }, [gymState]);

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

  // If not logged in, render beautiful login gate
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Sidebar Menu item lists
  const navigationItems = [
    { key: 'dashboard', name: '工作室工作台', icon: Dumbbell },
    { key: 'members', name: '学员管理', icon: Users },
    { key: 'packs', name: '学员课包套餐', icon: Layers },
    { key: 'logs', name: '上课消课记录', icon: ClipboardCheck },
    { key: 'payments', name: '缴费收据明细', icon: DollarSign },
    { key: 'backup', name: '数据安全中心', icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row relative font-sans">
      
      {/* 1. MOBILE RESPONSIVE HEADER */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Dumbbell className="h-4.5 w-4.5 text-white stroke-[2.5]" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">Fever Plus</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">
            {currentCoach}教练
          </span>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* 2. MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white/95 backdrop-blur-md z-25 flex flex-col justify-between pt-16">
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
                  className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      : 'bg-slate-50 text-slate-500 border border-transparent'
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
              <span className="text-xs text-slate-500 font-bold">联营执教中</span>
            </div>
            <button
              onClick={handleLogout}
              className="py-2 px-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-red-100"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        </div>
      )}

      {/* 3. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-200 p-6 shrink-0 sticky top-0 h-screen" id="desktop-sidebar">
        
        {/* Brand logo & header */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Dumbbell className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">Fever Plus</h1>
              <span className="text-[10px] text-slate-450 font-bold block mt-1 uppercase tracking-widest">
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
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/60 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
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
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-[11px] text-slate-600">当前执教教练: <b className="text-indigo-600 font-black">{currentCoach}</b></span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            id="nav-logout"
          >
            <LogOut className="h-4 w-4" />
            注销控制台退出
          </button>
        </div>

      </aside>

      {/* 4. MAIN PANEL CONTENT SECTION */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Render profile detail view specifically if member is selected */}
        {selectedMemberId ? (
          <MemberDetailScreen
            memberId={selectedMemberId}
            state={gymState}
            onBack={() => setSelectedMemberId(null)}
            onUpdateState={updateGymState}
          />
        ) : (
          <>
            {/* Tab Switched Panels */}
            {activeTab === 'dashboard' && (
              <DashboardScreen
                state={gymState}
                onOpenLogClass={() => setIsLogClassOpen(true)}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenLogPayment={() => setIsLogPaymentOpen(true)}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
                onNavigateToTab={(tab) => setActiveTab(tab as any)}
                currentCoach={currentCoach}
              />
            )}

            {activeTab === 'members' && (
              <MemberManagementScreen
                state={gymState}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
                onUpdateState={updateGymState}
              />
            )}

            {activeTab === 'packs' && (
              <CoursePackScreen
                state={gymState}
                onOpenLogPayment={() => setIsLogPaymentOpen(true)}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
              />
            )}

            {activeTab === 'logs' && (
              <ClassLogsScreen
                state={gymState}
                onNavigateToMember={(mid) => setSelectedMemberId(mid)}
                onOpenLogClass={() => setIsLogClassOpen(true)}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentLogsScreen
                state={gymState}
              />
            )}

            {activeTab === 'backup' && (
              <DataBackupScreen
                state={gymState}
                onUpdateState={updateGymState}
              />
            )}
          </>
        )}

      </main>

      {/* 5. QUICK ACTION MODAL INSTANCES */}
      <LogClassModal
        isOpen={isLogClassOpen}
        onClose={() => setIsLogClassOpen(false)}
        state={gymState}
        onUpdateState={updateGymState}
        currentCoach={currentCoach}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        state={gymState}
        onUpdateState={updateGymState}
      />

      <LogPaymentModal
        isOpen={isLogPaymentOpen}
        onClose={() => setIsLogPaymentOpen(false)}
        state={gymState}
        onUpdateState={updateGymState}
      />

    </div>
  );
}
