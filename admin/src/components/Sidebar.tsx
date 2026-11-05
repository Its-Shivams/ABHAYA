import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileWarning,
  MessageSquare,
  ShieldCheck,
  Siren,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/reports', icon: FileWarning, label: 'Reports' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
  { to: '/safety', icon: ShieldCheck, label: 'Safety' },
  { to: '/emergency', icon: Siren, label: 'Emergency' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  return (
    <aside className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-none">ABHAYA</p>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">ABHAYA v1.0.0</p>
        <p className="text-xs text-gray-400">Women's Safety Platform</p>
      </div>
    </aside>
  );
}
