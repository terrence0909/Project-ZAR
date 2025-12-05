import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield, Users, Eye, Edit, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  color: string;
}

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access with all permissions",
    userCount: 2,
    permissions: ["view_customers", "edit_customers", "delete_customers", "view_reports", "export_reports", "manage_users", "manage_roles", "view_audit_log"],
    color: "bg-destructive"
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Can view and analyze customer data",
    userCount: 5,
    permissions: ["view_customers", "view_reports", "export_reports"],
    color: "bg-primary"
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to dashboards",
    userCount: 12,
    permissions: ["view_customers", "view_reports"],
    color: "bg-muted-foreground"
  }
];

const allPermissions = [
  { id: "view_customers", label: "View Customers", category: "Customers" },
  { id: "edit_customers", label: "Edit Customers", category: "Customers" },
  { id: "delete_customers", label: "Delete Customers", category: "Customers" },
  { id: "view_reports", label: "View Reports", category: "Reports" },
  { id: "export_reports", label: "Export Reports", category: "Reports" },
  { id: "manage_users", label: "Manage Users", category: "Administration" },
  { id: "manage_roles", label: "Manage Roles", category: "Administration" },
  { id: "view_audit_log", label: "View Audit Log", category: "Administration" },
];

const RolesPermissions = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermission
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId]
        };
      }
      return role;
    }));
    toast.success("Permission updated");
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated="just now" />
      
      <main className="flex-1 md:ml-[280px] pt-16 md:pt-0">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Roles & Permissions</h1>
              <p className="text-sm text-muted-foreground">Manage user roles and access controls</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Roles Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <Card 
                key={role.id} 
                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedRole?.id === role.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`h-5 w-5 ${role.id === 'admin' ? 'text-destructive' : role.id === 'analyst' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {role.userCount}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions Matrix</CardTitle>
                  <CardDescription>
                    {selectedRole ? `Editing permissions for ${selectedRole.name}` : 'Select a role to edit permissions'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Add role feature coming soon")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedRole ? (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">{category}</h4>
                      <div className="space-y-3">
                        {permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              {perm.id.includes('view') && <Eye className="h-4 w-4 text-muted-foreground" />}
                              {perm.id.includes('edit') && <Edit className="h-4 w-4 text-muted-foreground" />}
                              {perm.id.includes('delete') && <Trash2 className="h-4 w-4 text-muted-foreground" />}
                              {perm.id.includes('manage') && <Shield className="h-4 w-4 text-muted-foreground" />}
                              {perm.id.includes('export') && <Shield className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-sm">{perm.label}</span>
                            </div>
                            <Switch
                              checked={selectedRole.permissions.includes(perm.id)}
                              onCheckedChange={() => handlePermissionToggle(selectedRole.id, perm.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a role above to manage its permissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RolesPermissions;
