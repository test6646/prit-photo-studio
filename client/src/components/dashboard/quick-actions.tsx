import { useState } from "react";
import { Plus, CheckSquare, UserPlus, DollarSign, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateEventModal from "@/components/modals/create-event-modal";
import AssignTaskModal from "@/components/modals/assign-task-modal";
import AddClientModal from "@/components/modals/add-client-modal";
import RecordPaymentModal from "@/components/modals/record-payment-modal";

export default function QuickActions() {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  const actions = [
    {
      label: "New Event",
      icon: Plus,
      onClick: () => setShowCreateEvent(true),
      primary: true,
    },
    {
      label: "Assign Task",
      icon: CheckSquare,
      onClick: () => setShowAssignTask(true),
    },
    {
      label: "Add Client",
      icon: UserPlus,
      onClick: () => setShowAddClient(true),
    },
    {
      label: "Record Payment",
      icon: DollarSign,
      onClick: () => setShowRecordPayment(true),
    },
  ];

  return (
    <>
      <Card className="bg-white shadow-sm border border-stone-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.primary ? "default" : "outline"}
                  className={`w-full justify-between p-4 h-auto ${
                    action.primary 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={action.onClick}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${
                      action.primary ? "text-primary-foreground" : "text-gray-600"
                    }`} />
                    <span className={`text-sm font-medium ${
                      action.primary ? "text-primary-foreground" : "text-gray-700"
                    }`}>
                      {action.label}
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${
                    action.primary ? "text-primary-foreground" : "text-gray-400"
                  }`} />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateEventModal 
        open={showCreateEvent} 
        onClose={() => setShowCreateEvent(false)} 
      />
      
      <AssignTaskModal 
        open={showAssignTask} 
        onClose={() => setShowAssignTask(false)} 
      />
      
      <AddClientModal 
        open={showAddClient} 
        onClose={() => setShowAddClient(false)} 
      />
      
      <RecordPaymentModal 
        open={showRecordPayment} 
        onClose={() => setShowRecordPayment(false)} 
      />
    </>
  );
}
