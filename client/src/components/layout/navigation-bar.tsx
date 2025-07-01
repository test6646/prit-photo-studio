import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
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
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Camera,
  Calendar,
  Users,
  CheckSquare,
  CreditCard,
  FileText,
  PieChart,
  Settings,
  Bell,
  Menu,
  LogOut,
  User,
  Building2,
  RefreshCw,
} from "lucide-react";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  color: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: PieChart, color: "bg-blue-500" },
  { title: "Events", href: "/events", icon: Calendar, color: "bg-green-500" },
  { title: "Payments", href: "/payments", icon: CreditCard, color: "bg-purple-500" },
  { title: "Tasks", href: "/tasks", icon: CheckSquare, color: "bg-orange-500" },
  { title: "Staff", href: "/staff", icon: Users, color: "bg-cyan-500" },
  { title: "Sheet", href: "/sheet", icon: FileText, color: "bg-emerald-500" },
  { title: "Quotations", href: "/quotations", icon: FileText, color: "bg-indigo-500" },
  { title: "Expenses", href: "/expenses", icon: CreditCard, color: "bg-red-500" },
  { title: "Finance", href: "/finance", icon: PieChart, color: "bg-yellow-500" },
];

export default function NavigationBar() {
  const [location] = useLocation();
  const { user, firm, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">Loading...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user || !firm) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location === href;
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => mobile && setMobileOpen(false)}
        >
          <Button
            variant={isActive(item.href) ? "default" : "ghost"}
            className={`${
              mobile ? "w-full justify-start" : ""
            } h-10 px-4 rounded-lg transition-all duration-200 ${
              isActive(item.href)
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.title}
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Button>
        </Link>
      ))}
    </>
  );

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <div className="flex items-center space-x-3 cursor-pointer">
                <Camera className="h-8 w-8 text-blue-600" />
                <span className="font-bold text-xl text-gray-900">
                  {firm.name.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            <NavItems />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Bell className="h-4 w-4" />
            </Button>

            {/* Sync Status */}
            <Button variant="ghost" size="sm" className="hidden sm:flex text-green-600">
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="text-xs">Synced</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback className="bg-blue-600 text-white font-medium">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge variant="outline" className="w-fit mt-1">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Studio Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center space-x-3 px-2">
                    <Camera className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-lg">{firm.name}</span>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <NavItems mobile />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}