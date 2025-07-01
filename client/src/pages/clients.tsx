import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, User, Phone, Mail, MapPin, MoreHorizontal, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, formatPhone } from "@/lib/utils";
import AddClientModal from "@/components/modals/add-client-modal";
import type { Client } from "@shared/schema";

export default function Clients() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientStats = (clientId: number) => {
    const clientEvents = events.filter((event: any) => event.clientId === clientId);
    const totalSpent = clientEvents.reduce((sum: number, event: any) => sum + (event.totalAmount || 0), 0);
    const completedEvents = clientEvents.filter((event: any) => event.status === "completed").length;
    
    return {
      totalEvents: clientEvents.length,
      completedEvents,
      totalSpent,
      lastEvent: clientEvents.length > 0 ? Math.max(...clientEvents.map((e: any) => new Date(e.eventDate).getTime())) : null
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access client management.</CardDescription>
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Clients</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage your client relationships and contact information
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                    <div className="h-6 w-20 bg-slate-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client: Client) => {
              const stats = getClientStats(client.id);
              
              return (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <p className="text-sm text-slate-500">{client.clientType}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Client</DropdownMenuItem>
                          <DropdownMenuItem>Create Event</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 mb-4">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Mail className="w-4 h-4" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span>{formatPhone(client.phone)}</span>
                        </div>
                      )}
                      
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{client.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Client Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>Events</span>
                        </div>
                        <p className="font-semibold">{stats.totalEvents}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span>Total</span>
                        </div>
                        <p className="font-semibold">{formatCurrency(stats.totalSpent)}</p>
                      </div>
                    </div>

                    {stats.completedEvents > 0 && (
                      <div className="mt-3 text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {stats.completedEvents} Completed
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredClients.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No clients found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm ? "No clients match your search." : "Get started by adding your first client."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        <AddClientModal 
          open={showAddModal} 
          onClose={() => setShowAddModal(false)} 
        />
      </div>
    </div>
  );
}