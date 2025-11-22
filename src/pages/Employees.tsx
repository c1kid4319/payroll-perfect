import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  daily_wage: number;
  overtime_rate: number;
  half_day_rate: number;
  status: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    daily_wage: "",
    overtime_rate: "",
    half_day_rate: "",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading employees");
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const employeeData = {
      full_name: formData.full_name,
      email: formData.email || null,
      phone: formData.phone || null,
      daily_wage: parseFloat(formData.daily_wage),
      overtime_rate: parseFloat(formData.overtime_rate),
      half_day_rate: parseFloat(formData.half_day_rate),
    };

    if (editingEmployee) {
      const { error } = await supabase
        .from("employees")
        .update(employeeData)
        .eq("id", editingEmployee.id);

      if (error) {
        toast.error("Error updating employee");
      } else {
        toast.success("Employee updated successfully");
        setOpen(false);
        loadEmployees();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("employees").insert([employeeData]);

      if (error) {
        toast.error("Error adding employee");
      } else {
        toast.success("Employee added successfully");
        setOpen(false);
        loadEmployees();
        resetForm();
      }
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      email: employee.email || "",
      phone: employee.phone || "",
      daily_wage: employee.daily_wage.toString(),
      overtime_rate: employee.overtime_rate.toString(),
      half_day_rate: employee.half_day_rate.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting employee");
    } else {
      toast.success("Employee deleted successfully");
      loadEmployees();
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      daily_wage: "",
      overtime_rate: "",
      half_day_rate: "",
    });
    setEditingEmployee(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">Manage your employee records</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? "Edit Employee" : "Add New Employee"}
                </DialogTitle>
                <DialogDescription>
                  Enter employee details and wage information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_wage">Daily Wage *</Label>
                    <Input
                      id="daily_wage"
                      type="number"
                      step="0.01"
                      value={formData.daily_wage}
                      onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime_rate">OT Rate *</Label>
                    <Input
                      id="overtime_rate"
                      type="number"
                      step="0.01"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="half_day_rate">Half Day *</Label>
                    <Input
                      id="half_day_rate"
                      type="number"
                      step="0.01"
                      value={formData.half_day_rate}
                      onChange={(e) => setFormData({ ...formData, half_day_rate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEmployee ? "Update" : "Add"} Employee
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
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Daily Wage</TableHead>
                <TableHead className="text-right">OT Rate</TableHead>
                <TableHead className="text-right">Half Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No employees found. Add your first employee to get started.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.full_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {employee.email && <div>{employee.email}</div>}
                        {employee.phone && <div className="text-muted-foreground">{employee.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">₹{employee.daily_wage.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{employee.overtime_rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{employee.half_day_rate.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

export default Employees;
