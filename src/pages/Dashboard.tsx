import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Car, LogOut, TrendingUp, DollarSign, Package, CheckCircle,
  Clock, XCircle, BarChart3, ArrowLeft, Wrench
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  available: "hsl(142 70% 42%)",
  sold: "hsl(0 72% 52%)",
  reserved: "hsl(38 90% 52%)",
  in_treatment: "hsl(210 80% 52%)",
};

const STATUS_LABELS: Record<string, string> = {
  available: "זמין",
  sold: "נמכר",
  reserved: "שמור",
  in_treatment: "בטיפול",
};

const CustomTooltipHeb = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-card shadow-elevated p-3 text-right font-polin-light text-sm">
        {label && <p className="font-polin-medium text-foreground mb-1">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }}>
            {p.name}: {typeof p.value === "number" && p.value > 999 ? `₪${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
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

  // --- KPI calculations ---
  const total = vehicles.length;
  const available = vehicles.filter((v) => v.status === "available").length;
  const sold = vehicles.filter((v) => v.status === "sold").length;
  const reserved = vehicles.filter((v) => v.status === "reserved").length;
  const inTreatment = vehicles.filter((v) => v.status === "in_treatment").length;

  const inventoryValue = vehicles
    .filter((v) => v.status !== "sold")
    .reduce((sum, v) => sum + (v.asking_price ?? 0), 0);

  const totalRevenue = vehicles
    .filter((v) => v.status === "sold")
    .reduce((sum, v) => sum + (v.asking_price ?? 0), 0);

  const avgPrice = total > 0
    ? Math.round(vehicles.reduce((s, v) => s + (v.asking_price ?? 0), 0) / total)
    : 0;

  // --- Chart data ---
  const statusPieData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: vehicles.filter((v) => v.status === key).length,
    fill: STATUS_COLORS[key],
  })).filter((d) => d.value > 0);

  // Vehicles by branch
  const branchMap: Record<string, number> = {};
  vehicles.forEach((v) => {
    const b = v.branch ?? "לא מוגדר";
    branchMap[b] = (branchMap[b] ?? 0) + 1;
  });
  const branchData = Object.entries(branchMap).map(([name, count]) => ({ name, count }));

  // Vehicles by year
  const yearMap: Record<number, number> = {};
  vehicles.forEach((v) => {
    if (v.year) yearMap[v.year] = (yearMap[v.year] ?? 0) + 1;
  });
  const yearData = Object.entries(yearMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({ year, count }));

  // Manufacturer distribution
  const mfgMap: Record<string, number> = {};
  vehicles.forEach((v) => {
    const m = v.manufacturer ?? "אחר";
    mfgMap[m] = (mfgMap[m] ?? 0) + 1;
  });
  const mfgData = Object.entries(mfgMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  const kpiCards = [
    {
      label: "סה״כ רכבים במלאי",
      value: total,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/8",
      sub: `ממוצע מחיר: ₪${avgPrice.toLocaleString()}`,
    },
    {
      label: "רכבים זמינים",
      value: available,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      sub: `${total ? Math.round((available / total) * 100) : 0}% מהמלאי`,
    },
    {
      label: "ערך מלאי פעיל",
      value: `₪${(inventoryValue / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
      sub: `${available + reserved} רכבים פעילים`,
    },
    {
      label: "סה״כ רכבים נמכרו",
      value: sold,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: totalRevenue > 0 ? `₪${(totalRevenue / 1_000_000).toFixed(1)}M הכנסות` : "אין נתונים",
    },
    {
      label: "שמורים",
      value: reserved,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      sub: "ממתינים לסגירה",
    },
    {
      label: "בטיפול",
      value: inTreatment,
      icon: Wrench,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      sub: "בתהליך הכנה",
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
            <h1 className="text-xl font-polin-medium text-primary-foreground">דשבורד</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-polin-light text-primary-foreground/70 hidden sm:block">{user?.email}</span>
            <Badge className="bg-accent text-accent-foreground font-polin-medium border-0">
              {isAdmin ? "מנהל" : "איש מכירות"}
            </Badge>
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate("/")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 font-polin-light gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              למלאי
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
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
            {/* KPI Cards */}
            <section>
              <h2 className="text-lg font-polin-medium text-foreground mb-4">סיכום כללי</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((card) => (
                  <div key={card.label} className="bg-card rounded-xl border shadow-card p-4 flex flex-col gap-2 hover:shadow-elevated transition-shadow duration-200">
                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div className={`text-2xl font-polin-medium ${card.color}`}>{card.value}</div>
                    <div className="text-xs font-polin-medium text-foreground leading-tight">{card.label}</div>
                    <div className="text-xs font-polin-light text-muted-foreground">{card.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Charts row 1 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Pie */}
              <div className="bg-card rounded-xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-4">התפלגות סטטוסים</h3>
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={false}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltipHeb />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {statusPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs font-polin-light">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch Bar */}
              <div className="bg-card rounded-xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-4">רכבים לפי סניף</h3>
                {branchData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={branchData} layout="vertical" margin={{ right: 16, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fontFamily: "Polin" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "Polin" }} width={70} />
                      <Tooltip content={<CustomTooltipHeb />} />
                      <Bar dataKey="count" name="רכבים" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
              </div>
            </section>

            {/* Charts row 2 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Year Area */}
              <div className="bg-card rounded-xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-4">רכבים לפי שנת ייצור</h3>
                {yearData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={yearData}>
                      <defs>
                        <linearGradient id="colorYear" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 12, fontFamily: "Polin" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: "Polin" }} />
                      <Tooltip content={<CustomTooltipHeb />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="כמות"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2.5}
                        fill="url(#colorYear)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
              </div>

              {/* Manufacturer Bar */}
              <div className="bg-card rounded-xl border shadow-card p-6">
                <h3 className="font-polin-medium text-foreground mb-4">רכבים לפי יצרן</h3>
                {mfgData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={mfgData} margin={{ right: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Polin" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: "Polin" }} />
                      <Tooltip content={<CustomTooltipHeb />} />
                      <Bar dataKey="count" name="כמות" radius={[6, 6, 0, 0]}>
                        {mfgData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground font-polin-light">אין נתונים</div>
                )}
              </div>
            </section>

            {/* Recent vehicles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-polin-medium text-foreground">רכבים אחרונים שנכנסו</h2>
                <Button variant="outline" size="sm" onClick={() => navigate("/")} className="font-polin-light gap-1">
                  <Car className="h-4 w-4" />
                  כל המלאי
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...vehicles]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 6)
                  .map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate(`/vehicle/${v.id}`)}
                      className="bg-card rounded-xl border shadow-card p-4 cursor-pointer hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-polin-medium text-foreground text-sm">
                            {[v.manufacturer, v.model].filter(Boolean).join(" ") || "ללא שם"}
                          </p>
                          <p className="text-xs font-polin-light text-muted-foreground">{v.license_plate ?? "—"}</p>
                        </div>
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-polin-medium"
                          style={{
                            background: STATUS_COLORS[v.status ?? "available"] + "22",
                            color: STATUS_COLORS[v.status ?? "available"],
                            border: `1px solid ${STATUS_COLORS[v.status ?? "available"]}44`,
                          }}
                        >
                          {STATUS_LABELS[v.status ?? "available"]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-polin-light text-muted-foreground">{v.year ?? "—"} • {v.color ?? "—"}</span>
                        {v.asking_price && (
                          <span className="text-sm font-polin-medium text-accent">₪{v.asking_price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
