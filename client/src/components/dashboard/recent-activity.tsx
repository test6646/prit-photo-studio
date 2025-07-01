import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, DollarSign, UserPlus, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityLog } from "@shared/schema";

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "task_completed":
        return { icon: CheckCircle, className: "bg-green-100 text-green-600" };
      case "payment_received":
        return { icon: DollarSign, className: "bg-blue-100 text-blue-600" };
      case "client_added":
        return { icon: UserPlus, className: "bg-purple-100 text-purple-600" };
      case "task_reminder":
        return { icon: AlertTriangle, className: "bg-orange-100 text-orange-600" };
      default:
        return { icon: CheckCircle, className: "bg-gray-100 text-gray-600" };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-stone-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities?.map((activity) => {
            const { icon: Icon, className } = getActivityIcon(activity.action);
            
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(activity.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {activities?.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-gray-500">No recent activity</div>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
