import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { formatDate, getStatusColor, getStatusText, initials } from "@/lib/utils";
import AssignTaskModal from "@/components/modals/assign-task-modal";
import type { TaskWithDetails } from "@shared/schema";

export default function TaskOverview() {
  const [filter, setFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const { data: tasks, isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredTasks = tasks?.filter(task => {
    switch (filter) {
      case "due_today":
        const today = new Date().toDateString();
        return new Date(task.dueDate).toDateString() === today;
      case "overdue":
        return task.status === "overdue" || new Date(task.dueDate) < new Date();
      case "completed":
        return task.status === "completed";
      default:
        return true;
    }
  }).slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Tasks</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-sm border border-stone-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Team Tasks</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="due_today">Due Today</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={task.assignedUser.avatar} alt={task.assignedUser.firstName} />
                    <AvatarFallback className="text-xs">
                      {initials(task.assignedUser.firstName, task.assignedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      Assigned to {task.assignedUser.firstName} {task.assignedUser.lastName} • Due: {formatDate(task.dueDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`status-badge ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredTasks.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-gray-500 mb-2">No tasks found</div>
              <Button onClick={() => setShowAssignModal(true)}>
                Assign New Task
              </Button>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Button variant="link" className="text-primary">
              View All Tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      <AssignTaskModal 
        open={showAssignModal} 
        onClose={() => setShowAssignModal(false)} 
      />
    </>
  );
}
