import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { FinancialSummary as FinancialSummaryType } from "@shared/schema";

export default function FinancialSummary() {
  const { data: summary, isLoading } = useQuery<FinancialSummaryType>({
    queryKey: ["/api/dashboard/financial-summary"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financial Summary</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profitMarginPercentage = summary?.totalRevenue 
    ? Math.round((summary.netProfit / summary.totalRevenue) * 100)
    : 0;

  return (
    <Card className="bg-white shadow-sm border border-stone-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Financial Summary</CardTitle>
          <Select defaultValue="this_month">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Revenue Chart Placeholder */}
          <div className="h-32 studio-gradient rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {summary ? formatCurrency(summary.totalRevenue) : '₹0'}
              </div>
              <div className="text-sm text-white/90">Total Revenue</div>
            </div>
          </div>
          
          {/* Financial Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Received</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {summary ? formatCurrency(summary.receivedAmount) : '₹0'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {summary ? formatCurrency(summary.pendingAmount) : '₹0'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {summary ? formatCurrency(summary.totalExpenses) : '₹0'}
              </span>
            </div>
            
            <hr className="border-gray-200" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Net Profit</span>
              <div className="text-right">
                <span className={`text-sm font-bold ${
                  (summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary ? formatCurrency(summary.netProfit) : '₹0'}
                </span>
                <div className="text-xs text-gray-500">
                  {profitMarginPercentage}% margin
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
