import { Link, useLocation } from "react-router-dom";
import { Home, Users, Upload, AlertTriangle, TrendingUp, FileText, Settings, Building2, Menu, X, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  lastUpdated: string;
}

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Upload, label: "Data Import", path: "/data-import" },
  { icon: AlertTriangle, label: "Risk Alerts", path: "/alerts", badge: 3 },
  { icon: TrendingUp, label: "Market Data", path: "/market" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function DashboardSidebar({ lastUpdated }: DashboardSidebarProps) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    // Handle logout
    console.log("Logging out...");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileOpen(false)}>
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold">PROJECT ZAR</span>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover-lift relative group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Left border accent for active state */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-l-lg" />
              )}
              
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.label}</span>
              
              {/* Badge for alerts */}
              {item.badge && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-500 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {/* Live Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Last updated: {lastUpdated}</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">TZ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Tshepotau</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/30 transition-colors">
            ← Back to Analyzer
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-xs h-7"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-20 h-screen w-[280px] glass-card border-r border-border/50 backdrop-blur-md hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/50 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile Menu */}
          <aside className="fixed left-0 top-0 z-20 h-screen w-[280px] glass-card border-r border-border/50 backdrop-blur-md md:hidden flex flex-col pt-16">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}