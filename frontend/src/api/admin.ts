import { api } from "./client";

/* ----------------------------------------------------------------------
 * Shared types
 * -------------------------------------------------------------------- */

export interface Paged<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
}

/* ----------------------------------------------------------------------
 * Pumps
 * -------------------------------------------------------------------- */

export interface Nozzle {
  id: string;
  nozzle_number: number;
  fuel_type: string;
  product_name?: string | null;
}

export interface Pump {
  id: string;
  org_id: string;
  name: string;
  code: string | null;
  location?: string | null;
  nozzle_count: number;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
  nozzles?: Nozzle[];
}

export interface PumpCreatePayload {
  org_id: string;
  name: string;
  code?: string;
  location?: string;
  nozzle_count: number;
}

export interface PumpUpdatePayload {
  name?: string;
  code?: string;
  location?: string;
  is_active?: boolean;
}

/* ----------------------------------------------------------------------
 * Workers
 * -------------------------------------------------------------------- */

export interface Worker {
  id: string;
  user_id: string;
  pump_id: string;
  employee_code: string;
  joined_date: string | null;
  is_active?: boolean;
}

export interface WorkerCreatePayload {
  email: string;
  password: string;
  pump_id: string;
  employee_code: string;
  joined_date?: string;
}

export interface WorkerUpdatePayload {
  pump_id?: string;
  employee_code?: string;
  is_active?: boolean;
}

/* ----------------------------------------------------------------------
 * Shifts / Reconciliation / Anomalies / Audit
 * -------------------------------------------------------------------- */

export interface Shift {
  id: string;
  pump_id: string;
  worker_id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  slot?: string | null;
}

export interface ShiftListQuery {
  pump_id?: string;
  worker_id?: string;
  org_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface ReconciliationResult {
  id: string;
  shift_id: string;
  status: string;
  expected_cash: string | number;
  actual_cash: string | number;
  variance: string | number;
  confidence_score?: number | null;
  anomalies?: Array<Record<string, unknown>>;
  created_at: string;
}

export interface AnomalyFlag {
  id: string;
  shift_id: string;
  flag_type: string;
  severity: string;
  description?: string | null;
  amount?: string | number | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  resource_type: string;
  action: string;
  changes?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

/* ----------------------------------------------------------------------
 * Analytics
 * -------------------------------------------------------------------- */

export interface VarianceTrendRow {
  day: string;
  variance: number;
}

export interface GradeSalesRow {
  day: string;
  fuel_grade: string;
  liters: number;
  revenue: number;
}

export interface CashflowRow {
  day: string;
  cash: number;
  upi: number;
  card: number;
  fleet: number;
}

/* ----------------------------------------------------------------------
 * Inventory & Maintenance
 * -------------------------------------------------------------------- */

export interface InventoryItem {
  id: string;
  org_id: string;
  fuel_type: string;
  quantity: number;
  updated_at: string;
}

export interface MaintenanceItem {
  id: string;
  pump_id: string;
  type: string;
  scheduled_date: string | null;
  completed_date: string | null;
  notes?: string | null;
  created_at: string;
}

/* ----------------------------------------------------------------------
 * API
 * -------------------------------------------------------------------- */

export const adminApi = {
  // ── Pumps ─────────────────────────────────────────────────────────
  getPumps: (params?: { org_id?: string; page?: number; page_size?: number }) =>
    api
      .get<Paged<Pump> | Pump[]>("/pumps/", { params })
      .then((r) => r.data),
  getPump: (id: string) =>
    api.get<Pump>(`/pumps/${id}`).then((r) => r.data),
  createPump: (payload: PumpCreatePayload) =>
    api.post<Pump>("/pumps/", payload).then((r) => r.data),
  updatePump: (id: string, payload: PumpUpdatePayload) =>
    api.patch<Pump>(`/pumps/${id}`, payload).then((r) => r.data),
  deletePump: (id: string) =>
    api.delete(`/pumps/${id}`).then((r) => r.data),

  // ── Workers ───────────────────────────────────────────────────────
  getWorkers: (params?: {
    pump_id?: string;
    page?: number;
    page_size?: number;
  }) =>
    api
      .get<Paged<Worker> | Worker[]>("/workers/", { params })
      .then((r) => r.data),
  createWorker: (payload: WorkerCreatePayload) =>
    api.post<Worker>("/workers/", payload).then((r) => r.data),
  updateWorker: (id: string, payload: WorkerUpdatePayload) =>
    api.patch<Worker>(`/workers/${id}`, payload).then((r) => r.data),
  deleteWorker: (id: string) =>
    api.delete(`/workers/${id}`).then((r) => r.data),

  // ── Shifts ────────────────────────────────────────────────────────
  getShifts: (params?: ShiftListQuery) =>
    api
      .get<Paged<Shift>>("/shifts/", { params })
      .then((r) => r.data),
  getShift: (id: string) =>
    api.get<Shift>(`/shifts/${id}`).then((r) => r.data),

  // ── Reconciliation ────────────────────────────────────────────────
  getShiftReconciliation: (shiftId: string) =>
    api
      .get<ReconciliationResult>(`/reconciliation/shifts/${shiftId}`)
      .then((r) => r.data),
  getReconciliationQueue: (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }) =>
    api
      .get<Paged<Shift>>("/shifts/", {
        params: { status: "COMPLETED", ...params },
      })
      .then((r) => r.data),
  runReconciliation: (shiftId: string) =>
    api
      .post<ReconciliationResult>(`/reconciliation/shifts/${shiftId}/run`)
      .then((r) => r.data),

  // ── Anomalies ─────────────────────────────────────────────────────
  getAnomalies: (params?: {
    severity?: string;
    resolved?: boolean;
    page?: number;
    page_size?: number;
  }) =>
    api
      .get<Paged<AnomalyFlag>>("/anomaly-flags/", { params })
      .then((r) => r.data),
  resolveAnomaly: (id: string, notes?: string) =>
    api
      .patch<AnomalyFlag>(`/anomaly-flags/${id}`, {
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .then((r) => r.data),

  // ── Audit Logs ────────────────────────────────────────────────────
  getAuditLogs: (params?: {
    resource_type?: string;
    action?: string;
    user_id?: string;
    page?: number;
    page_size?: number;
  }) =>
    api
      .get<Paged<AuditLogItem>>("/audit-logs/", { params })
      .then((r) => r.data),

  // ── Analytics ─────────────────────────────────────────────────────
  getAnalytics: (params: { org_id: string; days?: number }) =>
    Promise.all([
      api.get<VarianceTrendRow[]>("/analytics/variance-trend", {
        params: { org_id: params.org_id, days: params.days ?? 30 },
      }),
      api.get<GradeSalesRow[]>("/analytics/grade-sales", {
        params: { org_id: params.org_id, days: params.days ?? 30 },
      }),
      api.get<CashflowRow[]>("/analytics/daily-cashflow", {
        params: { org_id: params.org_id, days: params.days ?? 30 },
      }),
    ]).then(([variance, grades, cashflow]) => ({
      variance: variance.data,
      grades: grades.data,
      cashflow: cashflow.data,
    })),

  getVarianceTrend: (org_id: string, days = 30) =>
    api
      .get<VarianceTrendRow[]>("/analytics/variance-trend", {
        params: { org_id, days },
      })
      .then((r) => r.data),

  // ── Inventory ─────────────────────────────────────────────────────
  getInventory: (params?: { org_id?: string }) =>
    api
      .get<Paged<InventoryItem> | InventoryItem[]>("/inventory/", {
        params,
      })
      .then((r) => r.data),
  updateInventory: (
    id: string,
    payload: { quantity: number; fuel_type?: string },
  ) =>
    api.patch<InventoryItem>(`/inventory/${id}`, payload).then((r) => r.data),

  // ── Maintenance ───────────────────────────────────────────────────
  getMaintenance: (params?: { pump_id?: string }) =>
    api
      .get<Paged<MaintenanceItem> | MaintenanceItem[]>("/maintenance/", {
        params,
      })
      .then((r) => r.data),
  createMaintenance: (payload: {
    pump_id: string;
    type: string;
    scheduled_date?: string;
    notes?: string;
  }) =>
    api.post<MaintenanceItem>("/maintenance/", payload).then((r) => r.data),
  updateMaintenance: (
    id: string,
    payload: {
      type?: string;
      scheduled_date?: string;
      completed_date?: string;
      notes?: string;
    },
  ) =>
    api.patch<MaintenanceItem>(`/maintenance/${id}`, payload).then((r) => r.data),
};
