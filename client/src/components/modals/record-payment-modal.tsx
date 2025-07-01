import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { insertPaymentSchema, type InsertPayment, type EventWithClient } from "@shared/schema";

type RecordPaymentFormData = Omit<InsertPayment, "firmId" | "receivedBy">;

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  eventId?: number;
}

export default function RecordPaymentModal({ open, onClose, eventId }: RecordPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events } = useQuery<EventWithClient[]>({
    queryKey: ["/api/events"],
    enabled: open,
  });

  const form = useForm<RecordPaymentFormData>({
    resolver: zodResolver(insertPaymentSchema.omit({ firmId: true, receivedBy: true })),
    defaultValues: {
      eventId: eventId || 0,
      amount: "",
      paymentMethod: "",
      notes: "",
    },
  });

  const selectedEventId = form.watch("eventId");
  const selectedEvent = events?.find(event => event.id === selectedEventId);

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: RecordPaymentFormData) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "card", label: "Card" },
    { value: "check", label: "Check" },
  ];

  const eventsWithBalance = events?.filter(event => {
    const totalPaid = event.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
    const totalAmount = parseFloat(event.totalAmount);
    return totalPaid < totalAmount;
  }) || [];

  const onSubmit = (data: RecordPaymentFormData) => {
    recordPaymentMutation.mutate(data);
  };

  const handleClose = () => {
    if (!recordPaymentMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  // Calculate remaining balance for selected event
  const getRemainingBalance = (event: EventWithClient) => {
    const totalPaid = event.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
    const totalAmount = parseFloat(event.totalAmount);
    return totalAmount - totalPaid;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
            <DialogTitle>Record Payment</DialogTitle>
          </div>
          <DialogDescription>
            Record a new payment received from a client.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Selection */}
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventsWithBalance.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title} - {event.client.name} 
                          <span className="text-sm text-gray-500 ml-2">
                            (Balance: {formatCurrency(getRemainingBalance(event))})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (₹) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="10000" 
                      {...field}
                    />
                  </FormControl>
                  {selectedEvent && (
                    <div className="text-sm text-gray-500">
                      Remaining balance: {formatCurrency(getRemainingBalance(selectedEvent))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Payment details, reference number, or any other notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Summary */}
            {selectedEvent && form.watch("amount") && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Payment Summary:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Event:</span>
                    <span className="font-medium">{selectedEvent.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client:</span>
                    <span className="font-medium">{selectedEvent.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Event Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedEvent.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous Payments:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedEvent.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Payment:</span>
                    <span className="font-medium">{formatCurrency(form.watch("amount") || "0")}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between font-medium">
                    <span>Remaining Balance:</span>
                    <span className={
                      getRemainingBalance(selectedEvent) - parseFloat(form.watch("amount") || "0") === 0
                        ? "text-green-600"
                        : "text-orange-600"
                    }>
                      {formatCurrency(
                        Math.max(0, getRemainingBalance(selectedEvent) - parseFloat(form.watch("amount") || "0"))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={recordPaymentMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {recordPaymentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record Payment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
