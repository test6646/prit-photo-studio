import { Camera, X, BarChart3, Calendar, CheckSquare, Users, DollarSign, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", href: "#", active: true },
    { icon: Calendar, label: "Events", href: "#" },
    { icon: CheckSquare, label: "Tasks", href: "#" },
    { icon: Users, label: "Clients", href: "#" },
    { icon: DollarSign, label: "Finances", href: "#" },
    { icon: UserCheck, label: "Team", href: "#" },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Camera className="text-primary-foreground h-4 w-4" />
              </div>
              <SheetTitle className="text-xl font-bold text-gray-900">
                StudioFlow
              </SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <nav className="p-6">
          <div className="space-y-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center space-x-3 ${
                    item.active
                      ? "text-primary font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  } transition-colors`}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
