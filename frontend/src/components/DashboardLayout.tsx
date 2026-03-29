import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Users, CreditCard, FileText, ClipboardList,
  BookOpen, LogOut, GraduationCap, Award, Menu, X, UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/receipt', label: 'Receipts', icon: FileText },
    { to: '/hall-ticket', label: 'Hall Tickets', icon: ClipboardList },
    { to: '/report-card', label: 'Report Cards', icon: BookOpen },
    { to: '/bonafide', label: 'Bonafide', icon: Award },
  ];

  if (user?.role === 'admin') {
    navItems.unshift({ to: '/admin-dashboard', label: 'Admin Home', icon: LayoutDashboard });
    navItems.push({ to: '/faculty-management', label: 'Faculty Management', icon: UserCog });
    navItems.push({ to: '/admin-settings', label: 'Admin Settings', icon: FileText });
  }

  if (user?.role === 'faculty') {
    navItems.unshift({ to: '/faculty-dashboard', label: 'Faculty Home', icon: LayoutDashboard });
    navItems.push({ to: '/faculty-schedule', label: 'Class Schedule', icon: ClipboardList });
  }

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
    }`;

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--sidebar-background))] flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary overflow-hidden">
            <img src="/logo.png" alt="School Logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground font-display">SADHANA MEMORIAL SCHOOL</h1>
            <p className="text-xs text-sidebar-foreground/60">School Management</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-accent-foreground">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground capitalize bg-secondary px-3 py-1 rounded-full">
            {user?.role}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
