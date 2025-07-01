import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, User, Clock, CheckCircle, Circle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import AssignTaskModal from "@/components/modals/assign-task-modal";
import type { TaskWithDetails } from "@shared/schema";

export default function Tasks() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, completedAt: status === "completed" ? new Date() : null }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const filteredTasks = tasks.filter((task: TaskWithDetails) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedUser.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (taskId: number, status: string) => {
    updateStatusMutation.mutate({ taskId, status });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access task management.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage and track project tasks and assignments
            </p>
          </div>
          <Button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Assign Task
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tasks, assignees, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4 w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                    <div className="h-6 w-20 bg-slate-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task: TaskWithDetails) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleStatusChange(task.id, task.status === "completed" ? "pending" : "completed")}
                        className="mt-1"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-semibold text-lg ${task.status === "completed" ? "line-through text-slate-500" : ""}`}>
                            {task.title}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(task.status)} text-white`}
                          >
                            {task.status}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(task.priority)}
                          >
                            {task.priority}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-slate-600 dark:text-slate-400 mb-3">
                            {task.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{task.assignedUser.firstName} {task.assignedUser.lastName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDate(task.dueDate)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Created: {formatDate(task.createdAt)}</span>
                          </div>
                        </div>

                        {task.event && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Related Event: <span className="font-medium">{task.event.title}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "in_progress")}>
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "pending")}>
                          Mark Pending
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTasks.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No tasks found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {searchTerm ? "No tasks match your search." : "Get started by creating your first task."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowAssignModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modal */}
        <AssignTaskModal 
          open={showAssignModal} 
          onClose={() => setShowAssignModal(false)} 
        />
      </div>
    </div>
  );
}