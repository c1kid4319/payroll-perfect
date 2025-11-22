import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingWages: 0,
    totalPaidThisMonth: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Get total employees
    const { count: employeeCount } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Get today's attendance count
    const today = new Date().toISOString().split("T")[0];
    const { count: attendanceCount } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "present");

    // Get unpaid wages count
    const { count: pendingCount } = await supabase
      .from("wages")
      .select("*", { count: "exact", head: true })
      .eq("paid", false);

    // Get total paid this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const { data: paidData } = await supabase
      .from("wages")
      .select("total_wage")
      .eq("paid", true)
      .gte("paid_at", startOfMonth.toISOString());

    const totalPaid = paidData?.reduce((sum, wage) => sum + Number(wage.total_wage), 0) || 0;

    setStats({
      totalEmployees: employeeCount || 0,
      todayAttendance: attendanceCount || 0,
      pendingWages: pendingCount || 0,
      totalPaidThisMonth: totalPaid,
    });
  };

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      description: "Active employees",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      description: "Present today",
      icon: Calendar,
      color: "text-accent",
    },
    {
      title: "Pending Wages",
      value: stats.pendingWages,
      description: "Awaiting payment",
      icon: DollarSign,
      color: "text-warning",
    },
    {
      title: "Paid This Month",
      value: `₹${stats.totalPaidThisMonth.toFixed(2)}`,
      description: "Total disbursed",
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your payroll system</p>
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
            <CardTitle>Welcome to Payroll Tracker</CardTitle>
            <CardDescription>
              Manage your employees, track attendance, calculate wages, and generate reports efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Navigate to <strong>Employees</strong> to add and manage employee records
            </p>
            <p className="text-sm text-muted-foreground">
              • Use <strong>Attendance</strong> to mark daily presence and track overtime
            </p>
            <p className="text-sm text-muted-foreground">
              • Check <strong>Wages</strong> for salary calculations and payment status
            </p>
            <p className="text-sm text-muted-foreground">
              • Generate detailed <strong>Reports</strong> for complete transparency
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
