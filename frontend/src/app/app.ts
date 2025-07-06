import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from './types/employee';
import { Shift } from './types/shift';
import { Assignment } from './types/assignment';
import { CalendarWrapperModule } from './calendar-wrapper.module';
import { environment } from '../environments/environment';



import {
  CalendarView,
  CalendarEvent,
  CalendarEventTimesChangedEvent,
} from 'angular-calendar';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CalendarWrapperModule],

  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  employees: Employee[] = [];
  shifts: Shift[] = [];
  assignments: Assignment[] = [];
  unassignedShifts: Shift[] = [];
  calendarEvents: CalendarEvent[] = [];
  overlappingShifts: { shift: Shift; employee: Employee }[] = [];
  CalendarView = CalendarView;
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  refresh = new Subject<void>();
  activeDayIsOpen: boolean = true;
  events: CalendarEvent[] = [];

  optimizationMetrics: any = null;

  setView(view: CalendarView) {
    this.view = view;
  }

  dayClicked({ day }: { day: any }): void {
    const date: Date = day.date;
    const events: CalendarEvent[] = day.events;

    if (this.isSameMonth(date, this.viewDate)) {
      if (
        (this.isSameDay(this.viewDate, date) && this.activeDayIsOpen) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
    alert(`${action}: ${event.title}`);
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();
  }

  isSameMonth(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

optimizeOnline() {
  const payload = {
    period: '2025-07-01 to 2025-07-14',
    employees: this.employees.map((e) => ({
      id: e.id,
      name: e.name,
      skills: e.skills,
      max_hours: e.max_hours,
      availability: {
        start: e.availability_start,
        end: e.availability_end,
      },
    })),
    shifts: this.shifts,
    current_assignments: this.assignments,
  };

  console.log('Sending payload:', JSON.stringify(payload, null, 2));

  fetch(`${environment.apiUrl}/api/schedule/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log('Backend response:', data);

      this.optimizationMetrics = data.metrics;

      if (data.success) {
        this.assignments = data.assignments;

        // 🟡 Convert shift IDs to full shift objects
        this.unassignedShifts = this.shifts.filter((s) =>
          data.unassigned_shifts.includes(s.id)
        );

        // 🟢 Map optimized assignments to calendar events
        this.calendarEvents = data.assignments.map((a: Assignment) => {
          const shift = this.shifts.find((s) => s.id === a.shift_id);
          const emp = this.employees.find((e) => e.id === a.employee_id);

          if (!shift || !emp){
            if (!shift) {
              console.warn(`Shift not found for ID: ${a.shift_id}`);
            }
            if (!emp) {
              console.warn(`Employee not found for ID: ${a.employee_id}`);
            }
            return null; // Skip this assignment if shift or employee is not found
          }

          return {
            start: new Date(shift.start_time),
            end: new Date(shift.end_time),
            title: `${shift.role} (${emp.name})`,
            color: {
              primary: '#00b894', // teal for optimized
              secondary: '#b2f5ea',
            },
            draggable: true,
            resizable: {
              beforeStart: true,
              afterEnd: true,
            },
          };
        }).filter((e: CalendarEvent | null): e is CalendarEvent => e !== null) as CalendarEvent[];

        console.log('Calendar events updated:', this.calendarEvents.length);

        if (this.calendarEvents.length >0) {
          this.viewDate = this.calendarEvents[0].start;
        }
        // 🔄 Refresh calendar
        this.refresh.next();
      }
    })
    .catch((err) => {
      console.error('Backend call failed:', err);
      alert('Backend is not available or request failed.');
    });
}


  onEmployeeFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        this.employees = this.parseEmployeeCSV(csvText);
        console.log('Employees loaded:', this.employees.length);
      };
      reader.readAsText(file);
    }
  }

  onShiftFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        this.shifts = this.parseShiftCSV(csvText);
        console.log('Shifts loaded:', this.shifts.length);
      };
      reader.readAsText(file);
    }
  }

  parseEmployeeCSV(csvText: string): Employee[] {
    const lines = csvText.split('\n');
    const employees: Employee[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(',');
        if (parts.length >= 6) {
          employees.push({
            id: parts[0],
            name: parts[1],
            skills: parts[2]
              .replace(/"/g, '')
              .split(',')
              .map((s) => s.trim()),
            max_hours: isNaN(parseInt(parts[3])) ? 0 : parseInt(parts[3]),
            availability_start: this.parseDateSafe(parts[4]),
            availability_end: this.parseDateSafe(parts[5]),
          });
        }
      }
    }
    return employees;
  }

  parseDateSafe(dateStr: string): string {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? new Date().toISOString()
      : date.toISOString();
  }

  parseShiftCSV(csvText: string): Shift[] {
    const lines = csvText.split('\n');
    const shifts: Shift[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(',');
        if (parts.length >= 5) {
          shifts.push({
            id: parts[0],
            role: parts[1],
            start_time: parts[2],
            end_time: parts[3],
            required_skill: parts[4],
          });
        }
      }
    }
    return shifts;
  }

  runScheduling() {
    console.log('Running greedy scheduling...');
    this.assignments = [];
    this.unassignedShifts = [];
    this.overlappingShifts = [];
    this.events = [];

    for (const shift of this.shifts) {
      let assigned = false;

      for (const employee of this.employees) {
        const { canAssign, overlap } = this.canAssignEmployeeToShift(
          employee,
          shift
        );

        if (canAssign) {
          this.assignments.push({
            shift_id: shift.id,
            employee_id: employee.id,
          });

          this.events.push({
            start: new Date(shift.start_time),
            end: new Date(shift.end_time),
            title: `${shift.role} (${employee.name})`,
            color: {
              primary: '#1e90ff',
              secondary: '#D1E8FF',
            },
            draggable: true,
            resizable: {
              beforeStart: true,
              afterEnd: true,
            },
          });

          assigned = true;
          break;
        } else if (overlap) {
          this.overlappingShifts.push({ shift, employee });
        }
      }

      if (!assigned) {
        this.unassignedShifts.push(shift);
      }
    }

    this.calendarEvents = [...this.events];
    console.log('Scheduling complete:', this.assignments.length, 'assignments');
    this.refresh.next();
  }
  canAssignEmployeeToShift(
    employee: Employee,
    shift: Shift
  ): { canAssign: boolean; overlap: boolean } {
    const shiftStart = new Date(shift.start_time);
    const shiftEnd = new Date(shift.end_time);
    const availStart = new Date(employee.availability_start);
    const availEnd = new Date(employee.availability_end);

    const shiftHours =
      (shiftEnd.getTime() - shiftStart.getTime()) / 1000 / 60 / 60;
    const currentHours = this.getTotalAssignedHours(employee.id);

    const hasOverlap = this.assignments.some((a) => {
      if (a.employee_id !== employee.id) return false;
      const s = this.shifts.find((shift) => shift.id === a.shift_id);
      if (!s) return false;
      const sStart = new Date(s.start_time);
      const sEnd = new Date(s.end_time);
      return shiftStart < sEnd && shiftEnd > sStart;
    });

    const canAssign =
      employee.skills.includes(shift.required_skill) &&
      shiftStart >= availStart &&
      shiftEnd <= availEnd &&
      currentHours + shiftHours <= employee.max_hours &&
      !hasOverlap;

    return { canAssign, overlap: hasOverlap };
  }

  getTotalAssignedHours(employeeId: string): number {
    let total = 0;
    for (const assignment of this.assignments) {
      if (assignment.employee_id === employeeId) {
        const shift = this.shifts.find((s) => s.id === assignment.shift_id);
        if (shift) {
          const start = new Date(shift.start_time);
          const end = new Date(shift.end_time);
          total += (end.getTime() - start.getTime()) / 1000 / 60 / 60;
        }
      }
    }
    return total;
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find((e) => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  }

  getShiftRole(shiftId: string): string {
    const shift = this.shifts.find((s) => s.id === shiftId);
    return shift ? shift.role : 'Unknown';
  }

  getShiftTime(shiftId: string): string {
    const shift = this.shifts.find((s) => s.id === shiftId);
    return shift ? `${shift.start_time} - ${shift.end_time}` : 'Unknown';
  }
}
