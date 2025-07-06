from pydantic import BaseModel
from typing import List, Dict, Optional


class Availability(BaseModel):
    start: str
    end: str


class Employee(BaseModel):
    id: str
    name: str
    skills: List[str]
    max_hours: int
    availability: Availability


class Shift(BaseModel):
    id: str
    role: str
    start_time: str
    end_time: str
    required_skill: str


class Assignment(BaseModel):
    shift_id: str
    employee_id: str


class OptimizationRequest(BaseModel):
    period: str
    employees: List[Employee]
    shifts: List[Shift]
    current_assignments: List[Assignment]


class OptimizationMetrics(BaseModel):
    total_overtime_minutes: int
    constraint_violations: int
    optimization_time_ms: int
    objective_value: float


class OptimizationResponse(BaseModel):
    success: bool
    assignments: List[Assignment]
    unassigned_shifts: List[str]
    metrics: OptimizationMetrics
    constraints_applied: List[str]
