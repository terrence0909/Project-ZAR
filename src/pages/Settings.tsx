import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Bell, Shield, Database, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Settings = () => {
  const [lastUpdated] = useState<Date>(new Date());
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

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
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 ml-0 md:ml-[280px] transition-all">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <Card className="glass-card border-border/50">
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
              <div className="flex items-center justify-between p-3 rounded-lg glass-card border border-border/50">
                <div>
                  <Label htmlFor="email-notif" className="font-semibold">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  id="email-notif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass-card border border-border/50">
                <div>
                  <Label htmlFor="risk-alerts" className="font-semibold">Risk Alerts</Label>
                  <p className="text-sm text-muted-foreground">Instant alerts for high-risk transactions</p>
                </div>
                <Switch
                  id="risk-alerts"
                  checked={riskAlerts}
                  onCheckedChange={setRiskAlerts}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass-card border border-border/50">
                <div>
                  <Label htmlFor="weekly-reports" className="font-semibold">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Summary reports every Monday</p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
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

          <Card className="glass-card border-border/50">
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
              <div className="flex items-center justify-between p-3 rounded-lg glass-card border border-border/50">
                <div>
                  <h3 className="font-semibold">Export All Data</h3>
                  <p className="text-sm text-muted-foreground">Download a complete copy of your data</p>
                </div>
                <Button variant="outline">Export</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass-card border border-border/50">
                <div>
                  <h3 className="font-semibold">Clear Cache</h3>
                  <p className="text-sm text-muted-foreground">Remove temporary data and cached files</p>
                </div>
                <Button variant="outline">Clear</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
