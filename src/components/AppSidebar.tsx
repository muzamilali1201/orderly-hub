import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  Menu,
  FileSpreadsheet,
  Youtube
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Sheets', href: '/sheets', icon: FileSpreadsheet, adminOnly: true },
  { name: 'Alerts', href: '/alerts', icon: Bell, showBadge: true },
  { name: 'Create Order', href: '/orders/new', icon: PlusCircle },
  { name: 'How to Use Portal', href: 'https://www.youtube.com/@abdulrehman6669', icon: Youtube, external: true },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border',
        !isMobile && collapsed ? 'justify-center' : 'justify-between'
      )}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(250_70%_60%)] flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">OrderFlow</span>
          </div>
        )}
        {!isMobile && collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(250_70%_60%)] flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive = !item.external && location.pathname === item.href;
            
            // External link (YouTube)
            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    !isMobile && collapsed && 'justify-center px-2'
                  )}
                >
                  <div className="relative shrink-0">
                    <item.icon className="w-5 h-5 text-red-500" />
                  </div>
                  {(isMobile || !collapsed) && <span>{item.name}</span>}
                </a>
              );
            }
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  !isMobile && collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative shrink-0">
                  <item.icon className="w-5 h-5" />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-green-500 text-white px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {(isMobile || !collapsed) && <span>{item.name}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* User Info */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50',
          !isMobile && collapsed && 'justify-center px-2'
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.username}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle - Desktop only */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full justify-center text-muted-foreground hover:text-foreground',
              !collapsed && 'justify-between'
            )}
          >
            {!collapsed && <span className="text-xs">Collapse</span>}
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            !isMobile && collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <LogOut className="w-4 h-4" />
          {(isMobile || !collapsed) && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Trigger - Fixed position */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-3 z-50 md:hidden bg-card/80 backdrop-blur-sm border border-border shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-sidebar to-background flex flex-col h-full">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out h-screen sticky top-0',
          collapsed ? 'w-16' : 'w-64',
          'bg-gradient-to-b from-sidebar to-background'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}