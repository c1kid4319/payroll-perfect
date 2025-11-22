import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react";

interface Wage {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  calculation_type: string;
  base_wage: number;
  overtime_amount: number;
  advance_deductions: number;
  total_wage: number;
  paid: boolean;
  paid_at: string | null;
  employees: {
    full_name: string;
  };
}

const Reports = () => {
  const [wages, setWages] = useState<Wage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    employeesPaid: 0,
    averageWage: 0,
  });

  useEffect(() => {
    loadWages();
  }, []);

  const loadWages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wages")
      .select("*, employees(full_name)")
      .order("paid_at", { ascending: false, nullsFirst: false });

    if (!error && data) {
      setWages(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (wageData: Wage[]) => {
    const paid = wageData.filter((w) => w.paid);
    const pending = wageData.filter((w) => !w.paid);

    const totalPaid = paid.reduce((sum, w) => sum + Number(w.total_wage), 0);
    const totalPending = pending.reduce((sum, w) => sum + Number(w.total_wage), 0);
    const uniqueEmployees = new Set(paid.map((w) => w.employee_id)).size;
    const averageWage = paid.length > 0 ? totalPaid / paid.length : 0;

    setStats({
      totalPaid,
      totalPending,
      employeesPaid: uniqueEmployees,
      averageWage,
    });
  };

  const statCards = [
    {
      title: "Total Paid",
      value: `₹${stats.totalPaid.toFixed(2)}`,
      description: "All completed payments",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Pending Payments",
      value: `₹${stats.totalPending.toFixed(2)}`,
      description: "Awaiting disbursement",
      icon: TrendingUp,
      color: "text-warning",
    },
    {
      title: "Employees Paid",
      value: stats.employeesPaid,
      description: "Unique recipients",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Average Wage",
      value: `₹${stats.averageWage.toFixed(2)}`,
      description: "Per payment period",
      icon: FileText,
      color: "text-accent",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive payment reports and wage transparency
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Complete record of all wage payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Base Wage</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Advances</TableHead>
                  <TableHead className="text-right">Net Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : wages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No payment records available.
                    </TableCell>
                  </TableRow>
                ) : (
                  wages.map((wage) => (
                    <TableRow key={wage.id}>
                      <TableCell className="font-medium">{wage.employees.full_name}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(wage.period_start), "MMM dd")} -{" "}
                        {format(new Date(wage.period_end), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{wage.calculation_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{wage.base_wage.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-success">
                        +₹{wage.overtime_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -₹{wage.advance_deductions.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{wage.total_wage.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {wage.paid ? (
                          <Badge variant="default" className="bg-success">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {wage.paid_at
                          ? format(new Date(wage.paid_at), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wage Calculation Breakdown</CardTitle>
            <CardDescription>Understanding how wages are calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Base Wage Calculation:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>Present:</strong> Full daily wage is added</li>
                <li>• <strong>Half Day:</strong> Half-day rate is added</li>
                <li>• <strong>Absent:</strong> No wage is added for the day</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Additional Calculations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong className="text-success">Overtime:</strong> Overtime hours × Overtime rate (added to total)</li>
                <li>• <strong className="text-destructive">Advances:</strong> Any advances taken during the period (deducted from total)</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Final Wage = Base Wage + Overtime Amount - Advance Deductions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
