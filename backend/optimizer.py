import time
from pulp import LpProblem, LpVariable, LpMinimize, lpSum, LpBinary, PulpSolverError, LpMaximize
from models import OptimizationRequest, OptimizationResponse, Assignment, OptimizationMetrics
from dateutil import parser


def parse_time(dt_str: str):
    dt = parser.parse(dt_str)
    return dt.replace(tzinfo=None)


def hours_between(start: str, end: str) -> float:
    delta = parse_time(end) - parse_time(start)
    return delta.total_seconds() / 3600


def run_ilp_optimization(request: OptimizationRequest) -> OptimizationResponse:
    start_time = time.time()
    prob = LpProblem("ShiftScheduling", LpMaximize)

    shifts = request.shifts
    employees = request.employees

    # Decision variables: x[shift_id][emp_id] = 1 if emp is assigned to shift
    x = {}
    for shift in shifts:
        eligible = {}
        for emp in employees:
            if (
                shift.required_skill in emp.skills and
                parse_time(shift.start_time) >= parse_time(emp.availability.start) and
                parse_time(shift.end_time) <= parse_time(emp.availability.end)
            ):
                eligible[emp.id] = LpVariable(f"x_{shift.id}_{emp.id}", 0, 1, LpBinary)
        if eligible:
            x[shift.id] = eligible

    total_vars = sum(len(emp_vars) for emp_vars in x.values())
    print(f"Total decision variables: {total_vars}")

    if total_vars == 0:
        print("❗ No valid assignments possible.")
        return OptimizationResponse(
            success=False,
            assignments=[],
            unassigned_shifts=[s.id for s in shifts],
            metrics=OptimizationMetrics(
                total_overtime_minutes=0,
                constraint_violations=1,
                optimization_time_ms=int((time.time() - start_time) * 1000),
                objective_value=0
            ),
            constraints_applied=["skill_matching", "availability", "max_hours", "no_overlap"]
        )

    # ✅ Objective: Maximize number of shift assignments
    prob += lpSum(var for emp_vars in x.values() for var in emp_vars.values()), "MaximizeAssignments"

    # ✅ Constraint 1: At most one employee per shift
    for shift_id, emp_vars in x.items():
        prob += lpSum(emp_vars.values()) <= 1, f"OneEmployeePerShift_{shift_id}"

    # ✅ Constraint 2: Respect max hours
    for emp in employees:
        total_hours = lpSum(
            x[shift.id][emp.id] * hours_between(shift.start_time, shift.end_time)
            for shift in shifts
            if shift.id in x and emp.id in x[shift.id]
        )
        if emp.max_hours and emp.max_hours > 0:
            prob += total_hours <= emp.max_hours, f"MaxHours_{emp.id}"

    # ✅ Constraint 3: Prevent overlapping shifts for same employee
    for emp in employees:
        for i in range(len(shifts)):
            for j in range(i + 1, len(shifts)):
                s1, s2 = shifts[i], shifts[j]
                if (
                    s1.id in x and emp.id in x[s1.id] and
                    s2.id in x and emp.id in x[s2.id] and
                    parse_time(s1.start_time) < parse_time(s2.end_time) and
                    parse_time(s2.start_time) < parse_time(s1.end_time)
                ):
                    prob += x[s1.id][emp.id] + x[s2.id][emp.id] <= 1, f"NoOverlap_{emp.id}_{s1.id}_{s2.id}"

    # 🔍 Debug: Print possible assignments
    print("Possible assignments:")
    for shift_id, emp_vars in x.items():
        for emp_id in emp_vars:
            print(f"  {shift_id} → {emp_id}")

    try:
        prob.solve()
    except PulpSolverError:
        return OptimizationResponse(
            success=False,
            assignments=[],
            unassigned_shifts=[s.id for s in shifts],
            metrics=OptimizationMetrics(
                total_overtime_minutes=0,
                constraint_violations=1,
                optimization_time_ms=int((time.time() - start_time) * 1000),
                objective_value=0
            ),
            constraints_applied=["skill_matching", "availability", "max_hours", "no_overlap"]
        )

    # ✅ Extract assignments from solution
    assignments = []
    assigned_shift_ids = set()

    for shift_id, emp_vars in x.items():
        for emp_id, var in emp_vars.items():
            if var.varValue == 1:
                assignments.append(Assignment(shift_id=shift_id, employee_id=emp_id))
                assigned_shift_ids.add(shift_id)

    unassigned_shifts = [s.id for s in shifts if s.id not in assigned_shift_ids]

    return OptimizationResponse(
        success=True,
        assignments=assignments,
        unassigned_shifts=unassigned_shifts,
        metrics=OptimizationMetrics(
            total_overtime_minutes=0,
            constraint_violations=0,
            optimization_time_ms=int((time.time() - start_time) * 1000),
            objective_value=len(assignments)
        ),
        constraints_applied=["skill_matching", "availability", "max_hours", "no_overlap"]
    )
