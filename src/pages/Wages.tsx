import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  full_name: string;
  daily_wage: number;
  overtime_rate: number;
  half_day_rate: number;
}

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
  employees: Employee;
}

const Wages = () => {
  const [wages, setWages] = useState<Wage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    period_start: "",
    period_end: "",
    calculation_type: "weekly",
  });

  useEffect(() => {
    loadEmployees();
    loadWages();
  }, []);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "active")
      .order("full_name");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const loadWages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wages")
      .select("*, employees(*)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading wages");
    } else {
      setWages(data || []);
    }
    setLoading(false);
  };

  const calculateWage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);

    try {
      // Get employee details
      const employee = employees.find((e) => e.id === formData.employee_id);
      if (!employee) throw new Error("Employee not found");

      // Get attendance records for the period
      const { data: attendanceData, error: attError } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", formData.employee_id)
        .gte("date", formData.period_start)
        .lte("date", formData.period_end);

      if (attError) throw attError;

      // Calculate wages
      let baseWage = 0;
      let overtimeAmount = 0;
      let advanceDeductions = 0;

      attendanceData?.forEach((att) => {
        if (att.status === "present") {
          baseWage += employee.daily_wage;
        } else if (att.status === "half_day") {
          baseWage += employee.half_day_rate;
        }
        // absent doesn't add to base wage

        if (att.overtime_hours > 0) {
          overtimeAmount += att.overtime_hours * employee.overtime_rate;
        }

        if (att.advance_taken > 0) {
          advanceDeductions += att.advance_taken;
        }
      });

      const totalWage = baseWage + overtimeAmount - advanceDeductions;

      // Insert wage record
      const { error: insertError } = await supabase.from("wages").insert([
        {
          employee_id: formData.employee_id,
          period_start: formData.period_start,
          period_end: formData.period_end,
          calculation_type: formData.calculation_type,
          base_wage: baseWage,
          overtime_amount: overtimeAmount,
          advance_deductions: advanceDeductions,
          total_wage: totalWage,
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Wage calculated successfully");
      setOpen(false);
      loadWages();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Error calculating wage");
    } finally {
      setCalculating(false);
    }
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("wages")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Error marking as paid");
    } else {
      toast.success("Marked as paid");
      loadWages();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      period_start: "",
      period_end: "",
      calculation_type: "weekly",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wages</h1>
            <p className="text-muted-foreground">Calculate and manage employee wages</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Calculate Wage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Calculate Wage</DialogTitle>
                <DialogDescription>
                  Calculate wages based on attendance records
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={calculateWage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calculation_type">Calculation Type *</Label>
                  <Select
                    value={formData.calculation_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, calculation_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period_start">Period Start *</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period_end">Period End *</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      Wages will be calculated based on attendance records between the selected
                      dates, including overtime and advance deductions.
                    </p>
                  </CardContent>
                </Card>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={calculating}>
                    {calculating ? "Calculating..." : "Calculate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Base Wage</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Advances</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading wages...
                  </TableCell>
                </TableRow>
              ) : wages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No wage records found. Calculate wages to get started.
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
                    <TableCell className="text-right">
                      {!wage.paid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsPaid(wage.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Wages;
