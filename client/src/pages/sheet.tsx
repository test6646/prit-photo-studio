import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Sheet() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Google Sheets</h1>
        <p className="text-gray-600 mt-1">View and manage your synchronized spreadsheets</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Spreadsheet Integration</CardTitle>
          <CardDescription>Real-time sync with Google Sheets</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Google Sheets integration page coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}