import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  HardDrive, 
  Settings,
  LogOut,
  Users,
  Shield,
  Key,
  Server
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile: any;
  className?: string;
}

const Sidebar = ({ activeTab, onTabChange, userProfile, className }: SidebarProps) => {
  const { signOut } = useAuth();

  const userMenuItems = [
    { id: 'files', label: 'My Files', icon: HardDrive },
  ];

  const adminMenuItems = [
    { id: 'files', label: 'File Browser', icon: HardDrive },
    { id: 'admin', label: 'Admin Panel', icon: Shield },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'server', label: 'Server Config', icon: Server },
    { id: 'permissions', label: 'Permissions', icon: Key },
  ];

  const menuItems = userProfile?.role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <div className={cn("bg-white border-r border-gray-200 flex flex-col", className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <HardDrive className="h-6 w-6 text-blue-600" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">FTP Manager</h1>
            {userProfile && (
              <p className="text-xs text-gray-600 truncate">
                {userProfile.display_name}
                {userProfile.role === 'admin' && (
                  <span className="ml-1 text-blue-600 font-medium">• Admin</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-sm",
              activeTab === item.id && "bg-blue-600 text-white hover:bg-blue-700"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;