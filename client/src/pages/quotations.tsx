import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Quotations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
        <p className="text-gray-600 mt-1">Create and manage client quotations</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quotation Management</CardTitle>
          <CardDescription>Create quotations and convert them to events</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Quotations page coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}