import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car, LogOut, TrendingUp, DollarSign, Package, CheckCircle,
  Clock, BarChart3, ArrowLeft, Wrench, CalendarDays, Users, ShieldCheck,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  available: "hsl(142 70% 42%)",
  sold:       "hsl(0 72% 52%)",
  reserved:   "hsl(38 90% 52%)",
  in_treatment: "hsl(210 80% 52%)",
};
const STATUS_LABELS: Record<string, string> = {
  available: "זמין", sold: "נמכר", reserved: "שמור", in_treatment: "בטיפול",
};

const MONTH_NAMES = ["ינ׳","פב׳","מר׳","אפ׳","מאי","יונ׳","יול׳","אוג׳","ספ׳","אוק׳","נוב׳","דצ׳"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card shadow-elevated p-3 text-right font-polin-light text-sm min-w-[130px]">
      {label && <p className="font-polin-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" && p.value > 5000
            ? `₪${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // ── KPI ──────────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total       = vehicles.length;
  const available   = vehicles.filter(v => v.status === "available").length;
  const sold        = vehicles.filter(v => v.status === "sold").length;
  const reserved    = vehicles.filter(v => v.status === "reserved").length;
  const inTreatment = vehicles.filter(v => v.status === "in_treatment").length;

  const thisMonthVehicles = vehicles.filter(v =>
    new Date(v.entry_date ?? v.created_at) >= thisMonthStart
  );
  const thisMonthCount = thisMonthVehicles.length;
  const thisMonthSold  = thisMonthVehicles.filter(v => v.status === "sold").length;

  const inventoryValue = vehicles
    .filter(v => v.status !== "sold")
    .reduce((s, v) => s + (v.asking_price ?? 0), 0);

  const soldRevenue = vehicles
    .filter(v => v.status === "sold")
    .reduce((s, v) => s + (v.asking_price ?? 0), 0);

  const avgPrice = total > 0
    ? Math.round(vehicles.reduce((s, v) => s + (v.asking_price ?? 0), 0) / total) : 0;

  // ── Monthly sales chart (last 6 months) ─────────────────────────────
  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const soldCount = vehicles.filter(v => {
      const dt = new Date(v.entry_date ?? v.created_at);
      return v.status === "sold" && dt >= d && dt < end;
    }).length;
    const enteredCount = vehicles.filter(v => {
      const dt = new Date(v.entry_date ?? v.created_at);
      return dt >= d && dt < end;
    }).length;
    return { month: MONTH_NAMES[d.getMonth()], נמכרו: soldCount, נכנסו: enteredCount };
  });

  // ── Status pie ───────────────────────────────────────────────────────
  const statusPie = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({ name: label, value: vehicles.filter(v => v.status === key).length, fill: STATUS_COLORS[key] }))
    .filter(d => d.value > 0);

  // ── Branch bar ───────────────────────────────────────────────────────
  const branchMap: Record<string, { total: number; sold: number }> = {};
  vehicles.forEach(v => {
    const b = v.branch ?? "לא מוגדר";
    if (!branchMap[b]) branchMap[b] = { total: 0, sold: 0 };
    branchMap[b].total++;
    if (v.status === "sold") branchMap[b].sold++;
  });
  const branchData = Object.entries(branchMap).map(([name, d]) => ({ name, ...d }));

  // ── Manufacturer ─────────────────────────────────────────────────────
  const mfgMap: Record<string, number> = {};
  vehicles.forEach(v => { const m = v.manufacturer ?? "אחר"; mfgMap[m] = (mfgMap[m] ?? 0) + 1; });
  const mfgData = Object.entries(mfgMap).sort(([,a],[,b]) => b-a).slice(0,6).map(([name,count]) => ({ name, count }));

  // ── Hero KPI cards ────────────────────────────────────────────────────
  const heroStats = [
    {
      label: "ערך מלאי פעיל",
      value: inventoryValue >= 1_000_000
        ? `₪${(inventoryValue / 1_000_000).toFixed(1)}M`
        : `₪${inventoryValue.toLocaleString()}`,
      sub: `${available + reserved} רכבים פעילים`,
      icon: DollarSign,
      accent: true,
    },
    {
      label: "רכבים שנכנסו החודש",
      value: thisMonthCount,
      sub: `${thisMonthSold} נמכרו החודש`,
      icon: CalendarDays,
      accent: false,
    },
    {
      label: "סה״כ נמכרו",
      value: sold,
      sub: soldRevenue > 0 ? `₪${(soldRevenue / 1_000_000).toFixed(1)}M הכנסות` : "אין נתונים",
      icon: TrendingUp,
      accent: false,
    },
    {
      label: "זמינים למכירה",
      value: available,
      sub: `${total ? Math.round((available/total)*100) : 0}% מהמלאי`,
      icon: CheckCircle,
      accent: false,
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary shadow-elevated sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-polin-medium text-primary-foreground leading-tight">דשבורד</h1>
              <p className="text-xs font-polin-light text-primary-foreground/60">
                {now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-polin-light text-primary-foreground/70 hidden sm:block">{user?.email}</span>
            <Badge className="bg-accent text-accent-foreground font-polin-medium border-0">
              {isAdmin ? "מנהל" : "איש מכירות"}
            </Badge>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/users")}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 font-polin-light gap-1.5">
                <Users className="h-4 w-4" /><span className="hidden sm:inline">משתמשים</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 font-polin-light gap-1.5">
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">למלאי</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-8 animate-fade-in">
        {isLoading ? (
          <div className="py-32 text-center text-muted-foreground font-polin-light">טוען נתונים...</div>
        ) : (
          <>
            {/* ── Hero KPI row ── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {heroStats.map((s) => (
                <div key={s.label}
                  className={`rounded-2xl border p-5 flex flex-col gap-3 shadow-card hover:shadow-elevated transition-all duration-200 ${
                    s.accent ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    s.accent ? "bg-white/15" : "bg-muted"
                  }`}>
                    <s.icon className={`h-5 w-5 ${s.accent ? "text-accent" : "text-primary"}`} />
                  </div>
                  <div className={`text-3xl font-polin-medium ${s.accent ? "text-accent" : "text-foreground"}`}>
                    {s.value}
                  </div>
                  <div>
                    <p className={`text-sm font-polin-medium ${s.accent ? "text-primary-foreground" : "text-foreground"}`}>
                      {s.label}
                    </p>
                    <p className={`text-xs font-polin-light mt-0.5 ${s.accent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {s.sub}
                    </p>
                  </div>
                </div>
              ))}
            </section>

            {/* ── Secondary KPIs ── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "סה״כ במלאי", value: total, icon: Package, color: "text-foreground" },
                { label: "שמורים", value: reserved, icon: Clock, color: "text-amber-600" },
                { label: "בטיפול", value: inTreatment, icon: Wrench, color: "text-indigo-500" },
                { label: "ממוצע מחיר", value: `₪${(avgPrice/1000).toFixed(0)}K`, icon: DollarSign, color: "text-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-xl border shadow-card p-4 flex items-center gap-3">
                  <s.icon className={`h-5 w-5 flex-shrink-0 ${s.color}`} />
                  <div>
                    <div className={`text-xl font-polin-medium ${s.color}`}>{s.value}</div>
                    <div className="text-xs font-polin-light text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* ── Monthly chart (full width) ── */}
            <section className="bg-card rounded-2xl border shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-polin-medium text-foreground">רכבים שנכנסו ונמכרו — 6 חודשים אחרונים</h3>
                  <p className="text-xs font-polin-light text-muted-foreground mt-0.5">לפי תאריך כניסה למלאי</p>
                </div>
                <div className="flex gap-4">
                  {[{ color: "hsl(var(--primary))", label: "נכנסו" }, { color: "hsl(var(--accent))", label: "נמכרו" }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs font-polin-light text-muted-foreground">
                      <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlySales} barCategoryGap="30%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: "Polin" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: "Polin" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="נכנסו" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="נמכרו" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* ── Row: Pie + Branch ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status pie */}
              <div className="bg-card rounded-2xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-5">התפלגות סטטוסים</h3>
                {statusPie.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                          paddingAngle={3} dataKey="value">
                          {statusPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-3">
                      {statusPie.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs font-polin-light">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                          {d.name}: <span className="font-polin-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
              </div>

              {/* Branch bar */}
              <div className="bg-card rounded-2xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-5">רכבים לפי סניף</h3>
                {branchData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={branchData} layout="vertical" margin={{ right: 20, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fontFamily: "Polin" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "Polin" }} width={68} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" name="סה״כ" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                      <Bar dataKey="sold" name="נמכרו" fill="hsl(var(--accent))" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
              </div>
            </section>

            {/* ── Manufacturer + this-month vehicles ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Manufacturer */}
              <div className="bg-card rounded-2xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-5">רכבים לפי יצרן</h3>
                {mfgData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={mfgData} margin={{ right: 8, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Polin" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: "Polin" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="כמות" radius={[6,6,0,0]}>
                        {mfgData.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
              </div>

              {/* This month's vehicles list */}
              <div className="bg-card rounded-2xl border shadow-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-polin-medium text-foreground">רכבים שנכנסו החודש</h3>
                  <Badge variant="outline" className="font-polin-light text-xs">{thisMonthCount} רכבים</Badge>
                </div>
                {thisMonthVehicles.length === 0 ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10 opacity-20 mb-2" />
                    <p className="font-polin-light text-sm">לא נכנסו רכבים החודש</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[230px] overflow-y-auto pl-1">
                    {thisMonthVehicles
                      .sort((a,b) => new Date(b.entry_date ?? b.created_at).getTime() - new Date(a.entry_date ?? a.created_at).getTime())
                      .map(v => (
                        <div key={v.id}
                          onClick={() => navigate(`/vehicle/${v.id}`)}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 border bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors">
                          <div>
                            <p className="text-sm font-polin-medium text-foreground">
                              {[v.manufacturer, v.model].filter(Boolean).join(" ") || "ללא שם"}
                            </p>
                            <p className="text-xs font-polin-light text-muted-foreground">{v.license_plate ?? "—"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {v.asking_price && (
                              <span className="text-xs font-polin-medium text-accent">₪{v.asking_price.toLocaleString()}</span>
                            )}
                            <span className="inline-block rounded-full px-2 py-0.5 text-xs font-polin-medium"
                              style={{
                                background: STATUS_COLORS[v.status ?? "available"] + "22",
                                color: STATUS_COLORS[v.status ?? "available"],
                                border: `1px solid ${STATUS_COLORS[v.status ?? "available"]}55`,
                              }}>
                              {STATUS_LABELS[v.status ?? "available"]}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
