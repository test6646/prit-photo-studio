import { useState } from "react";
import { Camera, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/utils";
import MobileNavigation from "./mobile-navigation";
import type { User, Firm } from "@shared/schema";

interface NavigationHeaderProps {
  user: User;
  firm: Firm;
}

export default function NavigationHeader({ user, firm }: NavigationHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Camera className="text-primary-foreground h-4 w-4" />
                </div>
                <span className="text-xl font-bold text-gray-900">StudioFlow</span>
              </div>
              <div className="hidden md:block text-sm text-gray-500 border-l border-gray-300 pl-4">
                {firm.name}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-4 mb-1">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Events
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Tasks
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Clients
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Finances
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Team
              </a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              
              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xs">
                        {initials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                  <DropdownMenuItem>Studio Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <MobileNavigation 
        open={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
      />
    </>
  );
}
