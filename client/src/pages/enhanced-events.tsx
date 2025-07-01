import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, Filter, MoreHorizontal, Calendar, DollarSign, CheckCircle, Users, HardDrive, Camera, Video, Edit3 } from "lucide-react";
import type { EventWithClient, User, Client } from "@shared/schema";

const eventSchema = z.object({
  clientId: z.number().min(1, "Please select a client"),
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  eventType: z.enum(["wedding", "pre-wedding", "engagement", "birthday", "corporate"]),
  eventDate: z.string().min(1, "Event date is required"),
  venue: z.string().min(1, "Venue is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  photographerId: z.number().optional(),
  videographerId: z.number().optional(),
  photoEditorId: z.number().optional(),
  videoEditorId: z.number().optional(),
  storageDisk: z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]).optional(),
  storageSize: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EnhancedEvents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<EventWithClient[]>({
    queryKey: ["/api/events"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: team = [] } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await apiRequest("POST", "/api/events", {
        ...data,
        totalAmount: parseFloat(data.totalAmount),
        eventDate: new Date(data.eventDate),
        balanceAmount: parseFloat(data.totalAmount),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setCreateModalOpen(false);
      form.reset();
    },
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      clientId: 0,
      title: "",
      description: "",
      eventType: "wedding",
      eventDate: "",
      venue: "",
      totalAmount: "",
      photographerId: undefined,
      videographerId: undefined,
      photoEditorId: undefined,
      videoEditorId: undefined,
      storageDisk: undefined,
      storageSize: "",
    },
  });

  const filteredEvents = events.filter((event: EventWithClient) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || event.status === filterStatus;
    const matchesType = filterType === "all" || event.eventType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const getEventTypeBadge = (type: string) => {
    const colors = {
      wedding: "bg-rose-100 text-rose-800",
      "pre-wedding": "bg-blue-100 text-blue-800", 
      engagement: "bg-orange-100 text-orange-800",
      birthday: "bg-green-100 text-green-800",
      corporate: "bg-purple-100 text-purple-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStorageDiskBadge = (disk: string) => {
    const colors = ["bg-red-100 text-red-800", "bg-blue-100 text-blue-800", "bg-green-100 text-green-800", "bg-yellow-100 text-yellow-800", "bg-purple-100 text-purple-800", "bg-pink-100 text-pink-800"];
    const index = disk.charCodeAt(0) - 65; // A=0, B=1, etc.
    return colors[index % colors.length];
  };

  const photographers = team.filter(user => user.role === "photographer");
  const videographers = team.filter(user => user.role === "videographer");
  const editors = team.filter(user => user.role === "editor");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600 mt-1">Master events spreadsheet with complete workflow tracking</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Create a new photography event with complete details and team assignments.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wedding">Wedding</SelectItem>
                            <SelectItem value="pre-wedding">Pre-Wedding</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                            <SelectItem value="birthday">Birthday</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="Event venue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Event description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="photographerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photographer</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select photographer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {photographers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videographerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Videographer</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select videographer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {videographers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="photoEditorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo Editor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select photo editor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {editors.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoEditorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Editor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select video editor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {editors.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="storageDisk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Disk</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select storage disk" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                              <SelectItem key={letter} value={letter}>
                                Disk {letter}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="storageSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Size</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 100GB, 1TB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter(e => e.status === 'confirmed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.filter(e => e.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(events.reduce((sum, e) => sum + parseFloat(e.totalAmount || "0"), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Master Events Spreadsheet</CardTitle>
          <CardDescription>Complete event management with team assignments and storage tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="pre-wedding">Pre-Wedding</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">SR NO</TableHead>
                  <TableHead className="w-24">CLIENT ID</TableHead>
                  <TableHead className="min-w-48">NAME</TableHead>
                  <TableHead className="w-32">DATE</TableHead>
                  <TableHead className="w-32">EVENT TYPE</TableHead>
                  <TableHead className="w-32">TOTAL BILL</TableHead>
                  <TableHead className="w-32">CREDIT AMOUNT</TableHead>
                  <TableHead className="w-32">STILL AMOUNT</TableHead>
                  <TableHead className="w-40">PHOTOGRAPHER</TableHead>
                  <TableHead className="w-40">VIDEOGRAPHER</TableHead>
                  <TableHead className="w-40">PHOTO EDITOR</TableHead>
                  <TableHead className="w-40">VIDEO EDITOR</TableHead>
                  <TableHead className="w-32">STORAGE DISK</TableHead>
                  <TableHead className="w-32">STORAGE SIZE</TableHead>
                  <TableHead className="w-32">STATUS</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-8 text-gray-500">
                      {events.length === 0 ? "No events found. Create your first event!" : "No events match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event: EventWithClient, index) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{event.clientId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.client.name}</div>
                          <div className="text-sm text-gray-500">{event.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(event.eventDate)}</TableCell>
                      <TableCell>
                        <Badge className={getEventTypeBadge(event.eventType)}>
                          {event.eventType.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(parseFloat(event.totalAmount))}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(parseFloat(event.advanceAmount || "0"))}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(parseFloat(event.balanceAmount || "0"))}
                      </TableCell>
                      <TableCell>
                        {event.photographerId ? (
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            <span className="text-sm">Assigned</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.videographerId ? (
                          <div className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            <span className="text-sm">Assigned</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.photoEditorId ? (
                          <div className="flex items-center gap-1">
                            <Edit3 className="h-3 w-3" />
                            <span className="text-sm">Assigned</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.videoEditorId ? (
                          <div className="flex items-center gap-1">
                            <Edit3 className="h-3 w-3" />
                            <span className="text-sm">Assigned</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.storageDisk ? (
                          <Badge className={getStorageDiskBadge(event.storageDisk)}>
                            Disk {event.storageDisk}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.storageSize ? (
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            <span className="text-sm">{event.storageSize}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              Assign Team
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}