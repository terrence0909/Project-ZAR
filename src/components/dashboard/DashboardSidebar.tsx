import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Upload, AlertTriangle, TrendingUp, FileText, Settings, Building2, Menu, X, LogOut, Bell, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    console.log("Logging out...");
  };

  return (
    <>
      {/* Desktop Sidebar - Professional Glass Design */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 glass-card border-r border-border/40 backdrop-blur-xl flex-col z-30">
        {/* Logo with gradient */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">PROJECT ZAR</span>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Compliance Platform</p>
            </div>
          </Link>
        </div>

        {/* Menu Items - Compact & Professional */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  "hover:bg-white/5 hover:shadow-lg hover:shadow-primary/5",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border-l-2 border-primary shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary/20 text-primary" 
                    : "bg-white/5 group-hover:bg-primary/10"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <span className="font-medium text-sm flex-1">{item.label}</span>
                
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto px-1.5 py-0 h-5 text-xs font-semibold bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30"
                  >
                    {item.badge}
                  </Badge>
                )}
                
                {!item.badge && (
                  <div className="w-1 h-1 rounded-full bg-transparent group-hover:bg-primary/30 ml-auto"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section - Compact */}
        <div className="p-3 border-t border-white/10 space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-muted-foreground/70">Live</span>
            </div>
            <span className="text-muted-foreground/60 text-[10px]">{lastUpdated}</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">TT</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">Tshepo Tau</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">Administrator</p>
            </div>
            <Shield className="w-3 h-3 text-primary/50 group-hover:text-primary/70" />
          </div>

          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="w-full justify-start gap-2 text-xs h-7 hover:bg-white/5"
            >
              <Search className="w-3 h-3" />
              Back to Analyzer
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-xs h-7 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/5"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Sleek & Compact */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="h-9 w-9 bg-white/5 hover:bg-white/10"
            >
              {isMobileOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
            
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-bold">PROJECT ZAR</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative bg-white/5 hover:bg-white/10"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full border border-background"></span>
            </Button>
            
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">TZ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Side Panel (Not Full Screen) */}
      {isMobileOpen && (
        <>
          {/* Overlay with blur */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <aside className="md:hidden fixed left-0 top-0 z-40 h-screen w-72 glass-card border-r border-white/10 backdrop-blur-xl flex-col shadow-2xl shadow-black/50">
            <div className="h-full flex flex-col overflow-hidden">
              {/* Mobile Menu Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">PROJECT ZAR</p>
                      <p className="text-[10px] text-muted-foreground/70">Navigation Menu</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileOpen(false)}
                    className="h-7 w-7 bg-white/5 hover:bg-white/10"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Mobile Menu Items - Compact */}
              <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150",
                        "active:scale-[0.98]",
                        isActive
                          ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border-l border-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        isActive 
                          ? "bg-primary/20 text-primary" 
                          : "bg-white/5"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      
                      <span className="font-medium text-sm flex-1">{item.label}</span>
                      
                      {item.badge && (
                        <Badge 
                          variant="destructive" 
                          className="px-1.5 py-0 h-5 text-xs bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Section - Ultra Compact */}
              <div className="p-3 border-t border-white/10 space-y-2 flex-shrink-0">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-muted-foreground/70">System Online</span>
                  </div>
                  <span className="text-muted-foreground/60">{lastUpdated}</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">TZ</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">Tshepo Tau</p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">Admin • FIC Registered</p>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-center gap-1.5 text-xs h-7 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/5"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}