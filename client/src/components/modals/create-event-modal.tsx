import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Camera, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn, formatCurrency } from "@/lib/utils";
import { insertEventSchema, type InsertEvent, type Client, type User } from "@shared/schema";
import { z } from "zod";

const createEventSchema = insertEventSchema.extend({
  eventDate: z.date({
    required_error: "Event date is required",
  }),
  totalAmount: z.string().min(1, "Total amount is required"),
  advanceAmount: z.string().optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: open,
  });

  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ["/api/team"],
    enabled: open,
  });

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "",
      venue: "",
      totalAmount: "",
      advanceAmount: "0",
      clientId: 0,
      photographerId: undefined,
      videographerId: undefined,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventFormData) => {
      const eventData: InsertEvent = {
        ...data,
        eventDate: data.eventDate,
        totalAmount: data.totalAmount,
        advanceAmount: data.advanceAmount || "0",
        balanceAmount: (parseFloat(data.totalAmount) - parseFloat(data.advanceAmount || "0")).toString(),
        photographerId: data.photographerId || null,
        videographerId: data.videographerId || null,
      };
      
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Event Created",
        description: "Your event has been successfully created.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const photographers = teamMembers?.filter(member => 
    member.role === "photographer" || member.role === "admin"
  ) || [];

  const videographers = teamMembers?.filter(member => 
    member.role === "videographer" || member.role === "admin"
  ) || [];

  const eventTypes = [
    { value: "wedding", label: "Wedding" },
    { value: "birthday", label: "Birthday Party" },
    { value: "corporate", label: "Corporate Event" },
    { value: "portrait", label: "Portrait Session" },
    { value: "fashion", label: "Fashion Shoot" },
    { value: "product", label: "Product Photography" },
    { value: "event", label: "General Event" },
  ];

  const onSubmit = (data: CreateEventFormData) => {
    createEventMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createEventMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </div>
            <DialogTitle>Create New Event</DialogTitle>
          </div>
          <DialogDescription>
            Add a new photography event to your studio management system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Smith Wedding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Type */}
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Event details, special requirements, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Date */}
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date *</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Venue */}
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Amount */}
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Advance Amount */}
              <FormField
                control={form.control}
                name="advanceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10000" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photographer */}
              <FormField
                control={form.control}
                name="photographerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photographer</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign photographer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {photographers.map((photographer) => (
                          <SelectItem key={photographer.id} value={photographer.id.toString()}>
                            {photographer.firstName} {photographer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Videographer */}
              <FormField
                control={form.control}
                name="videographerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Videographer</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign videographer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {videographers.map((videographer) => (
                          <SelectItem key={videographer.id} value={videographer.id.toString()}>
                            {videographer.firstName} {videographer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Balance Preview */}
            {form.watch("totalAmount") && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Financial Summary:</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Amount</div>
                    <div className="font-medium">{formatCurrency(form.watch("totalAmount") || "0")}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Advance</div>
                    <div className="font-medium">{formatCurrency(form.watch("advanceAmount") || "0")}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Balance</div>
                    <div className="font-medium">
                      {formatCurrency(
                        (parseFloat(form.watch("totalAmount") || "0") - 
                         parseFloat(form.watch("advanceAmount") || "0")).toString()
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={createEventMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEventMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createEventMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Event
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
