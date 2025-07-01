import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Calendar, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@shared/schema";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const statsCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "₹0",
      change: stats ? `+${stats.monthlyGrowth}% from last month` : "",
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: "positive",
    },
    {
      label: "Active Events",
      value: stats?.activeEvents || 0,
      change: stats ? `${stats.weeklyEvents} this week` : "",
      icon: Calendar,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Pending Tasks",
      value: stats?.pendingTasks || 0,
      change: stats ? `${stats.tasksToday} due today` : "",
      icon: Clock,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      label: "Team Members",
      value: stats?.teamMembers || 0,
      change: stats ? `${stats.activeTeamMembers} active` : "",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white shadow-sm border border-stone-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm mt-1 ${
                      stat.trend === "positive" ? "text-green-600" : "text-blue-600"
                    }`}>
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
