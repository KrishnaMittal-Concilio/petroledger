import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Lock, LockOpen, Search } from "lucide-react";
import { Badge, Button, Card, Input } from "../../components/ui";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { providerApi, TenantSummary } from "../../api/provider";

function errMsg(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { detail?: string } }; message?: string };
  return e?.response?.data?.detail || e?.message || fallback;
}

function fmtMoney(v: number): string {
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingLock, setPendingLock] = useState<TenantSummary | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setTenants(await providerApi.getTenants());
    } catch (err) {
      toast.error(errMsg(err, "Failed to load tenants."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tenants.filter((t) => {
      if (plan && t.subscription_plan !== plan) return false;
      if (statusFilter === "active" && (t.is_locked || !t.is_active))
        return false;
      if (statusFilter === "locked" && !t.is_locked) return false;
      if (!term) return true;
      return (
        t.name.toLowerCase().includes(term) ||
        t.owner_email.toLowerCase().includes(term)
      );
    });
  }, [tenants, q, plan, statusFilter]);

  async function confirmLock() {
    if (!pendingLock) return;
    setBusy(true);
    try {
      if (pendingLock.is_locked) {
        await providerApi.unlockTenant(pendingLock.tenant_id);
        toast.success("Tenant unlocked.");
      } else {
        await providerApi.lockTenant(pendingLock.tenant_id);
        toast.success("Tenant locked.");
      }
      setPendingLock(null);
      void load();
    } catch (err) {
      toast.error(errMsg(err, "Failed to toggle lock."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage every dealer tenant on the platform."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search name or owner email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="All plans"
          options={[
            { value: "BASIC", label: "Basic" },
            { value: "PRO", label: "Pro" },
            { value: "ENTERPRISE", label: "Enterprise" },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "locked", label: "Locked" },
          ]}
        />
      </div>

      <DataTable<TenantSummary>
        data={filtered}
        loading={loading}
        rowKey={(t) => t.tenant_id}
        emptyState={
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Building2 className="h-6 w-6 text-slate-400" />
            <span>No tenants match the filters.</span>
          </div>
        }
        columns={[
          {
            key: "name",
            header: "Name",
            render: (t) => (
              <div>
                <Link
                  to={`/provider/tenants/${t.tenant_id}`}
                  className="font-medium text-slate-900 hover:text-indigo-600"
                >
                  {t.name}
                </Link>
                <div className="text-xs text-slate-500">{t.owner_email}</div>
              </div>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (t) => <Badge tone="indigo">{t.subscription_plan}</Badge>,
          },
          {
            key: "revenue",
            header: "Monthly",
            render: (t) => fmtMoney(t.monthly_price_inr),
          },
          {
            key: "orgs",
            header: "Orgs",
            render: (t) => t.org_count,
          },
          {
            key: "users",
            header: "Users",
            render: (t) => t.user_count,
          },
          {
            key: "status",
            header: "Status",
            render: (t) =>
              t.is_locked ? (
                <Badge tone="red">Locked</Badge>
              ) : (
                <Badge tone="green">
                  {t.subscription_status || "active"}
                </Badge>
              ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (t) => (
              <div className="flex items-center justify-end gap-2">
                <Link
                  to={`/provider/tenants/${t.tenant_id}`}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  View
                </Link>
                <Button
                  variant={t.is_locked ? "secondary" : "danger"}
                  onClick={() => setPendingLock(t)}
                  className="py-1.5 px-3 text-xs"
                >
                  {t.is_locked ? (
                    <>
                      <LockOpen className="h-3.5 w-3.5" /> Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Lock
                    </>
                  )}
                </Button>
              </div>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={!!pendingLock}
        title={pendingLock?.is_locked ? "Unlock tenant?" : "Lock tenant?"}
        message={
          pendingLock?.is_locked
            ? `Unlocking ${pendingLock?.name} restores access for all its users.`
            : `Locking ${pendingLock?.name} blocks all its users from the API immediately.`
        }
        destructive={!pendingLock?.is_locked}
        busy={busy}
        confirmLabel={pendingLock?.is_locked ? "Unlock" : "Lock"}
        onCancel={() => setPendingLock(null)}
        onConfirm={confirmLock}
      />
    </div>
  );
}
