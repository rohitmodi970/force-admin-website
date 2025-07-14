'use client';
import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Clock, 
  User, 
  LogOut
} from 'lucide-react';

// Types
interface MenuItemType {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string | number;
}

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

interface ToggleButtonProps {
  onClick: () => void;
}

interface SidebarHeaderProps {
  onClose: () => void;
}

interface NavigationItemProps extends MenuItemType {}

interface UserSectionProps {
  onLogout: () => Promise<void>;
}

const Sidenavbar: React.FC = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleDrawer = (): void => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async (): Promise<void> => {
    await signOut();
  };

  return (
    <>
      {/* Toggle Button */}
      <ToggleButton onClick={toggleDrawer} />
      
      {/* Sidebar Drawer */}
      <SidebarDrawer 
        isOpen={isOpen} 
        onClose={toggleDrawer} 
        onLogout={handleLogout}
      />
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-xs  bg-opacity-50 z-30"
          onClick={toggleDrawer}
        />
      )}
    </>
  );
};

// Toggle Button Component
const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={onClick}
        className="flex items-center justify-center w-12 h-12 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
};

// Main Sidebar Drawer Component
const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose, onLogout }) => {
    return (
        <div className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-xl transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
            
            {/* Header */}
            <SidebarHeader onClose={onClose} />
            
            {/* Navigation Menu */}
            <NavigationMenu />
            
            {/* User Profile & Logout */}
            <UserSection onLogout={onLogout} />
        </div>
    );
};

// Sidebar Header Component
const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onClose }) => {
    return (
        <div className="flex items-center justify-between p-4 border-b">
            <h5 className="text-base font-semibold text-gray-800">
                Admin Panel
            </h5>
            <button
                onClick={onClose}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
            >
                <X className="w-5 h-5" />
                <span className="sr-only">Close menu</span>
            </button>
        </div>
    );
};

// Navigation Menu Component
const NavigationMenu: React.FC = () => {
    const menuItems: MenuItemType[] = [
        {
            href: '/admin/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard'
        },
        {
            href: '/admin/users',
            icon: Users,
            label: 'Users'
        },
        {
            href: '/admin/beta-users',
            icon: UserPlus,
            label: 'Beta Users'
        },
        {
            href: '/admin/waitlist',
            icon: Clock,
            label: 'Waitlist'
        }
    ];

    return (
        <div className="py-4 overflow-y-auto flex-1">
            <ul className="space-y-2 font-medium px-3">
                {menuItems.map((item) => (
                    <NavigationItem key={item.href} {...item} />
                ))}
            </ul>
        </div>
    );
};

// Individual Navigation Item Component
const NavigationItem: React.FC<NavigationItemProps> = ({ href, icon: Icon, label, badge }) => {
    return (
        <li>
            <a
                href={href}
                className="flex items-center p-3 text-gray-900 rounded-lg hover:bg-gray-100 group transition-colors"
            >
                <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3 flex-1">{label}</span>
                {badge && (
                    <span className="inline-flex items-center justify-center px-2 ml-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                        {badge}
                    </span>
                )}
            </a>
        </li>
    );
};

// User Section Component
const UserSection: React.FC<UserSectionProps> = ({ onLogout }) => {
    const { data: session } = useSession();

    return (
        <div className="absolute bottom-0 w-full p-6 border-t bg-gray-50">
            <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">
                        {session?.user?.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {session?.user?.email || 'admin@example.com'}
                    </p>
                </div>
            </div>
            <button
                onClick={onLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
            </button>
        </div>
    );
};

export default Sidenavbar;