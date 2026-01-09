import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Calendar, Clock, User, Phone, Mail, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

interface AppointmentCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: Id<"consultationDoctors">;
  doctorName: string;
}

export function AppointmentCalendarDialog({
  open,
  onOpenChange,
  doctorId,
  doctorName,
}: AppointmentCalendarDialogProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const appointments = useQuery(api.consultations.getDoctorAppointments, {
    doctorId,
    startDate: format(monthStart, "yyyy-MM-dd"),
    endDate: format(monthEnd, "yyyy-MM-dd"),
  });

  const stats = useQuery(api.consultations.getDoctorAppointmentStats, { doctorId });
  const updateAppointmentStatus = useMutation(api.consultations.updateAppointmentStatus);

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const appointmentsByDate = useMemo(() => {
    if (!appointments) return new Map();
    const map = new Map<string, any[]>();
    appointments.forEach((apt: any) => {
      const dateKey = apt.preferredDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(apt);
    });
    return map;
  }, [appointments]);

  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return appointmentsByDate.get(dateKey) || [];
  }, [selectedDate, appointmentsByDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedAppointment(null);
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setStatusUpdate(appointment.status);
    setNotes(appointment.notes || "");
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppointment) return;
    setIsUpdating(true);
    try {
      await updateAppointmentStatus({
        appointmentId: selectedAppointment._id,
        status: statusUpdate as any,
        notes: notes || undefined,
      });
      toast.success("Appointment status updated");
      setSelectedAppointment(null);
    } catch (error) {
      toast.error("Failed to update appointment status");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Appointment Calendar - {doctorName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-5 gap-2">
                <Card>
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                      <div className="text-xs text-muted-foreground">Confirmed</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                      <div className="text-xs text-muted-foreground">Cancelled</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Calendar Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                    Previous
                  </Button>
                  <CardTitle className="text-lg">
                    {format(currentDate, "MMMM yyyy")}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayAppointments = appointmentsByDate.get(dateKey) || [];
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateClick(day)}
                        className={`
                          relative p-2 text-sm rounded-md transition-colors min-h-[60px] flex flex-col items-center justify-start
                          ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                          ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
                          ${isToday && !isSelected ? "border-2 border-primary" : ""}
                        `}
                      >
                        <span className="font-medium">{format(day, "d")}</span>
                        {dayAppointments.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap justify-center">
                            {dayAppointments.slice(0, 3).map((apt: any, i: number) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${getStatusColor(apt.status)}`}
                              />
                            ))}
                            {dayAppointments.length > 3 && (
                              <span className="text-[10px]">+{dayAppointments.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!selectedDate && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Click on a date to view appointments
                  </p>
                )}
                {selectedDate && selectedDateAppointments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No appointments on this date
                  </p>
                )}
                {selectedDateAppointments.map((apt: any) => (
                  <Card
                    key={apt._id}
                    className={`cursor-pointer transition-colors ${
                      selectedAppointment?._id === apt._id ? "border-primary" : ""
                    }`}
                    onClick={() => handleAppointmentClick(apt)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{apt.patientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{apt.preferredSlot}</span>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(apt.status)} className="text-xs">
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {apt.consultationMode} - {apt.phone}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Appointment Details */}
            {selectedAppointment && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Appointment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedAppointment.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAppointment.phone}</span>
                    </div>
                    {selectedAppointment.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{selectedAppointment.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAppointment.preferredSlot}</span>
                    </div>
                    {selectedAppointment.concern && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-xs">{selectedAppointment.concern}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="status">Update Status</Label>
                      <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleUpdateStatus}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Update Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
