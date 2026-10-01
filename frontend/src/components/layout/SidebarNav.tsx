import React from 'react';
import {
  LayoutDashboard,
  Tv,
  Box,
  Car,
  PlusCircle,
  DoorOpen,
  CreditCard,
  History,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface SidebarNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  timeOfDay?: 'DAY' | 'NIGHT';
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab = 'dashboard',
  onSelectTab,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: Tv },
    { id: 'parking-3d', label: 'Parking Area (3D)', icon: Box },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'entry-mgmt', label: 'Entry Management', icon: PlusCircle },
    { id: 'exit-mgmt', label: 'Exit Management', icon: DoorOpen },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'history', label: 'Parking History', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 border-r flex flex-col justify-between flex-shrink-0 select-none py-4 px-3 h-screen bg-white border-slate-200 text-slate-800 shadow-sm">
      {/* Brand Header */}
      <div>
        <div className="flex items-center space-x-2.5 px-2 pb-5 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/25">
            <span className="font-extrabold text-white text-base leading-none">P</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            Smart Parking System
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab?.(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer Widget */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <div>
              <div className="text-xs font-bold leading-tight text-slate-900">
                Admin
              </div>
              <div className="text-[10px] text-slate-500">
                Administrator
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </aside>
  );
};
