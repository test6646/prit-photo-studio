import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Expenses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <p className="text-gray-600 mt-1">Track business expenses and equipment costs</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense Management</CardTitle>
          <CardDescription>Record and categorize all business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Expenses page coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}