import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency, formatDate, getStatusColor, getStatusText, getEventTypeIcon, getEventTypeColor } from "@/lib/utils";
import CreateEventModal from "@/components/modals/create-event-modal";
import type { EventWithClient } from "@shared/schema";

export default function RecentEventsTable() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data: events, isLoading } = useQuery<EventWithClient[]>({
    queryKey: ["/api/events"],
  });

  const recentEvents = events?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Events</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {recentEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEventTypeColor(event.eventType)}`}>
                          <i className={`${getEventTypeIcon(event.eventType)} text-sm`}></i>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.client.name}</div>
                      <div className="text-sm text-gray-500">{event.client.phone}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(event.eventDate)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`status-badge ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(event.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {recentEvents.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-500 mb-2">No events found</div>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEventModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </>
  );
}
