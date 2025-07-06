import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Employee} from './types/employee';
import {Shift} from './types/shift';
import {Assignment} from './types/assignment';


@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'] 
})
export class App {
  employees: Employee[] = [];
  shifts: Shift[] = [];
  assignments: Assignment[] = [];
  unassignedShifts: Shift[] = [];

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
        if (parts.length >= 5) {
          employees.push({
            id: parts[0],
            name: parts[1],
            skills: parts[2].replace(/"/g, '').split(',').map(s => s.trim()),
            max_hours: parseInt(parts[3]),
            availability_start: parts[4],
            availability_end: parts[5]
          });
        }
      }
    }
    return employees;
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
            required_skill: parts[4]
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
    
    for (const shift of this.shifts) {
      let assigned = false;
      
      for (const employee of this.employees) {
        if (this.canAssignEmployeeToShift(employee, shift)) {
          this.assignments.push({
            shift_id: shift.id,
            employee_id: employee.id
          });
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        this.unassignedShifts.push(shift);
      }
    }
    
    console.log('Scheduling complete:', this.assignments.length, 'assignments');
  }

  canAssignEmployeeToShift(employee: Employee, shift: Shift): boolean {
    return employee.skills.includes(shift.required_skill);
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  }

  getShiftRole(shiftId: string): string {
    const shift = this.shifts.find(s => s.id === shiftId);
    return shift ? shift.role : 'Unknown';
  }

  getShiftTime(shiftId: string): string {
    const shift = this.shifts.find(s => s.id === shiftId);
    return shift ? `${shift.start_time} - ${shift.end_time}` : 'Unknown';
  }
}