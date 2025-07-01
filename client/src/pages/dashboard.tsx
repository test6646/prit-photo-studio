import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import NavigationHeader from "@/components/layout/navigation-header";
import StatsOverview from "@/components/dashboard/stats-overview";
import RecentEventsTable from "@/components/dashboard/recent-events-table";
import TaskOverview from "@/components/dashboard/task-overview";
import QuickActions from "@/components/dashboard/quick-actions";
import FinancialSummary from "@/components/dashboard/financial-summary";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, firm, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="h-16 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <Skeleton className="h-8 w-48 mt-4" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !firm) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <NavigationHeader user={user} firm={firm} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user.firstName}! Here's what's happening at your studio today.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <RecentEventsTable />
            <TaskOverview />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <QuickActions />
            <FinancialSummary />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
