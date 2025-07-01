import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Finance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-600 mt-1">Financial reports and analytics</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Revenue, expenses, and profit analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Finance page coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}