import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Shield, Database, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [lastUpdated] = useState<Date>(new Date());
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const navigate = useNavigate();

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <DashboardSidebar lastUpdated={getTimeAgo()} />
      </div>
      
      <main className="flex-1 w-full md:ml-[280px] transition-all">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <SettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h1 className="text-base md:text-2xl font-bold">Settings</h1>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 md:hidden"
                  onClick={() => navigate(-1)}
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <Button onClick={handleSave} size="sm" className="h-9 md:h-10">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure how you receive alerts and updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1 flex-1 pr-4">
                  <Label htmlFor="email-notif" className="font-semibold text-sm md:text-base">
                    Email Notifications
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <div className="relative">
                  {/* Custom mobile Switch wrapper */}
                  <div className="md:hidden">
                    <Switch
                      id="email-notif"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      className="scale-90"
                    />
                  </div>
                  {/* Desktop Switch */}
                  <div className="hidden md:block">
                    <Switch
                      id="email-notif"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1 flex-1 pr-4">
                  <Label htmlFor="risk-alerts" className="font-semibold text-sm md:text-base">
                    Risk Alerts
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Instant alerts for high-risk transactions
                  </p>
                </div>
                <div className="relative">
                  <div className="md:hidden">
                    <Switch
                      id="risk-alerts"
                      checked={riskAlerts}
                      onCheckedChange={setRiskAlerts}
                      className="scale-90"
                    />
                  </div>
                  <div className="hidden md:block">
                    <Switch
                      id="risk-alerts"
                      checked={riskAlerts}
                      onCheckedChange={setRiskAlerts}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1 flex-1 pr-4">
                  <Label htmlFor="weekly-reports" className="font-semibold text-sm md:text-base">
                    Weekly Reports
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Summary reports every Monday
                  </p>
                </div>
                <div className="relative">
                  <div className="md:hidden">
                    <Switch
                      id="weekly-reports"
                      checked={weeklyReports}
                      onCheckedChange={setWeeklyReports}
                      className="scale-90"
                    />
                  </div>
                  <div className="hidden md:block">
                    <Switch
                      id="weekly-reports"
                      checked={weeklyReports}
                      onCheckedChange={setWeeklyReports}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keep the rest of your code the same */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="Confirm new password" />
              </div>
              <Button variant="outline">Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Configure data retention and export options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1 flex-1 pr-4">
                  <h3 className="font-semibold text-sm md:text-base">Export All Data</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Download a complete copy of your data
                  </p>
                </div>
                <Button variant="outline" size="sm">Export</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1 flex-1 pr-4">
                  <h3 className="font-semibold text-sm md:text-base">Clear Cache</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Remove temporary data and cached files
                  </p>
                </div>
                <Button variant="outline" size="sm">Clear</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;