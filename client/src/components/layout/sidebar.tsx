import { Link, useLocation } from "wouter";
import { Home, Calendar, CheckSquare, Users, Camera, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Clients", href: "/clients", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-700">
      {/* Logo */}
      <div className="flex items-center gap-2 p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">StudioFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}