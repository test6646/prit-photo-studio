import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Calendar, Users, Camera, Video, DollarSign, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import CreateEventModal from "@/components/modals/create-event-modal";
import RecordPaymentModal from "@/components/modals/record-payment-modal";
import type { EventWithClient } from "@shared/schema";

export default function Events() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | null>(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const filteredEvents = events.filter((event: EventWithClient) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (eventId: number, status: string) => {
    updateStatusMutation.mutate({ eventId, status });
  };

  const handleRecordPayment = (event: EventWithClient) => {
    setSelectedEvent(event);
    setShowPaymentModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access events management.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Events</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage your photography sessions and events
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search events by title or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-4"></div>
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
            {filteredEvents.map((event: EventWithClient) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(event.status)} text-white`}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.client.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.eventDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatCurrency(event.totalAmount)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {event.eventType === "photography" && <Camera className="w-4 h-4" />}
                          {event.eventType === "videography" && <Video className="w-4 h-4" />}
                          <span className="capitalize">{event.eventType}</span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRecordPayment(event)}>
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(event.id, "in_progress")}>
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(event.id, "completed")}>
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(event.id, "cancelled")}>
                          Cancel Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredEvents.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    No events found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {searchTerm ? "No events match your search." : "Get started by creating your first event."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modals */}
        <CreateEventModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
        
        {selectedEvent && (
          <RecordPaymentModal 
            open={showPaymentModal} 
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedEvent(null);
            }}
            eventId={selectedEvent.id}
          />
        )}
        </div>
      </div>
    </AppLayout>
  );
}