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
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  full_name: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  status: string;
  overtime_hours: number;
  advance_taken: number;
  notes: string | null;
  employees: Employee;
}

const Attendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formData, setFormData] = useState({
    employee_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "present",
    overtime_hours: "0",
    advance_taken: "0",
    notes: "",
  });

  useEffect(() => {
    loadEmployees();
    loadAttendance();
  }, [selectedDate]);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name")
      .eq("status", "active")
      .order("full_name");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance")
      .select("*, employees(id, full_name)")
      .eq("date", selectedDate)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading attendance");
    } else {
      setAttendance(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const attendanceData = {
      employee_id: formData.employee_id,
      date: formData.date,
      status: formData.status,
      overtime_hours: parseFloat(formData.overtime_hours),
      advance_taken: parseFloat(formData.advance_taken),
      notes: formData.notes || null,
    };

    const { error } = await supabase.from("attendance").insert([attendanceData]);

    if (error) {
      if (error.code === "23505") {
        toast.error("Attendance already marked for this employee on this date");
      } else {
        toast.error("Error marking attendance");
      }
    } else {
      toast.success("Attendance marked successfully");
      setOpen(false);
      loadAttendance();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "present",
      overtime_hours: "0",
      advance_taken: "0",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: "default",
      absent: "destructive",
      half_day: "secondary",
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">Track daily attendance and overtime</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
                <DialogDescription>Record employee attendance for the day</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overtime">Overtime Hours</Label>
                    <Input
                      id="overtime"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.overtime_hours}
                      onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advance">Advance Taken</Label>
                    <Input
                      id="advance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.advance_taken}
                      onChange={(e) => setFormData({ ...formData, advance_taken: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Mark Attendance</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center">
          <Label htmlFor="filter-date" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Filter by Date:
          </Label>
          <Input
            id="filter-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Overtime (hrs)</TableHead>
                <TableHead className="text-right">Advance Taken</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading attendance...
                  </TableCell>
                </TableRow>
              ) : attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No attendance records for this date.
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employees.full_name}</TableCell>
                    <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">{record.overtime_hours.toFixed(1)}</TableCell>
                    <TableCell className="text-right">₹{record.advance_taken.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {record.notes || "-"}
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

export default Attendance;
