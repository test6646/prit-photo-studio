import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import NavigationBar from "./navigation-bar";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, firm, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Always call hooks in the same order
  useEffect(() => {
    if (!isLoading && (!user || !firm)) {
      const authPages = ["/login", "/signup", "/login-email"];
      if (!authPages.includes(location)) {
        setLocation("/login");
      }
    }
  }, [user, firm, location, setLocation, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your studio...</p>
        </div>
      </div>
    );
  }

  // Show unauthenticated state
  const authPages = ["/login", "/signup", "/login-email"];
  const isAuthPage = authPages.includes(location);
  
  if (!user || !firm) {
    if (isAuthPage) {
      return <div className="min-h-screen bg-gray-50">{children}</div>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show authenticated layout
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}