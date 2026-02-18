import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Car, Eye, Download, SlidersHorizontal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ManufacturerLogo from "@/components/ManufacturerLogo";

const statusLabels: Record<string, string> = {
  available: "זמין",
  sold: "נמכר",
  reserved: "שמור",
  in_treatment: "בטיפול",
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700 border border-green-200",
  sold: "bg-red-100 text-red-700 border border-red-200",
  reserved: "bg-amber-100 text-amber-700 border border-amber-200",
  in_treatment: "bg-blue-100 text-blue-700 border border-blue-200",
};

const vehicleTypeLabels: Record<string, string> = {
  small: "רכב קטן",
  family: "משפחתי",
  executive: "מנהלים",
  suv: "SUV / ג'יפ",
  van: "ואן / מסחרי",
  truck: "משאית / פיקאפ",
  electric: "חשמלי",
};

const engineTypeLabels: Record<string, string> = {
  gasoline: "בנזין",
  diesel: "דיזל",
  hybrid: "היברידי",
  plugin_hybrid: "היברידי פלאג-אין",
  electric: "חשמלי",
  lpg: "גז (LPG)",
};

interface Filters {
  search: string;
  status: string;
  manufacturer: string;
  model: string;
  color: string;
  branch: string;
  minPrice: string;
  maxPrice: string;
}

const emptyFilters: Filters = {
  search: "",
  status: "all",
  manufacturer: "all",
  model: "all",
  color: "all",
  branch: "all",
  minPrice: "",
  maxPrice: "",
};

export default function Inventory() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key: keyof Filters) => (val: string) =>
    setFilters((f) => ({ ...f, [key]: val }));

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Unique option lists derived from data
  const options = useMemo(() => {
    const uniq = (arr: (string | null | undefined)[]) =>
      [...new Set(arr.filter(Boolean))].sort() as string[];
    return {
      manufacturers: uniq(vehicles.map((v) => v.manufacturer)),
      models: uniq(
        vehicles
          .filter((v) => filters.manufacturer === "all" || v.manufacturer === filters.manufacturer)
          .map((v) => v.model)
      ),
      colors: uniq(vehicles.map((v) => v.color)),
      branches: uniq(vehicles.map((v) => v.branch)),
    };
  }, [vehicles, filters.manufacturer]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: "הרכב נמחק בהצלחה" });
    },
    onError: (err: Error) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (filters.search && !v.license_plate?.includes(filters.search) &&
          !v.manufacturer?.includes(filters.search) && !v.model?.includes(filters.search))
        return false;
      if (filters.status !== "all" && v.status !== filters.status) return false;
      if (filters.manufacturer !== "all" && v.manufacturer !== filters.manufacturer) return false;
      if (filters.model !== "all" && v.model !== filters.model) return false;
      if (filters.color !== "all" && v.color !== filters.color) return false;
      if (filters.branch !== "all" && v.branch !== filters.branch) return false;
      if (filters.minPrice && (v.asking_price ?? 0) < Number(filters.minPrice)) return false;
      if (filters.maxPrice && (v.asking_price ?? 0) > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [vehicles, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.manufacturer !== "all") count++;
    if (filters.model !== "all") count++;
    if (filters.color !== "all") count++;
    if (filters.branch !== "all") count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    return count;
  }, [filters]);

  const clearFilters = () => setFilters(emptyFilters);

  const exportToExcel = () => {
    const rows = filtered.map((v) => ({
      "יצרן": v.manufacturer || "",
      "דגם": v.model || "",
      "רמת גימור": v.trim_level || "",
      "מספר רישוי": v.license_plate || "",
      "מספר שלדה": v.chassis_number || "",
      "מספר מנוע": v.engine_number || "",
      "קוד רכב": v.code || "",
      "קוד דגם": v.model_code || "",
      "שנה": v.year || "",
      "צבע": v.color || "",
      "יד": v.hand ?? "",
      "ק\"מ": v.odometer || "",
      "כ\"ס": v.horsepower || "",
      "נפח מנוע": v.engine_volume || "",
      "סוג מנוע": v.engine_type || "",
      "תיבת הילוכים": v.transmission || "",
      "מושבים": v.seats || "",
      "דלתות": v.doors || "",
      "תאריך כניסה": v.entry_date || "",
      "תאריך טסט": v.test_date || "",
      "סטטוס": statusLabels[v.status || "available"],
      "סניף": v.branch || "",
      "איש מכירות": v.salesperson || "",
      "סוג עסקה": v.deal_type === "brokerage" ? "תיווך" : "מכירה רגילה",
      "מחיר רשימה": v.list_price || "",
      "מחיר רשימה משוקלל": v.weighted_list_price || "",
      "מחיר קנייה": v.purchase_price || "",
      "הוצאות": v.expenses || "",
      "אגרת רישוי": v.registration_fee || "",
      "מחיר מבוקש": v.asking_price || "",
      "רכב מקורי": v.is_original ? "כן" : "לא",
      "עצור": v.is_pledged ? "כן" : "לא",
      "דרוש מסלול": v.needs_route ? "כן" : "לא",
      "הערות": v.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "מלאי רכבים");
    ws["!cols"] = Array(Object.keys(rows[0] || {}).length).fill({ wch: 18 });
    XLSX.writeFile(wb, `מלאי_רכבים_${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.xlsx`);
    toast({ title: "הקובץ יוצא בהצלחה", description: `${filtered.length} רכבים יוצאו לאקסל` });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary shadow-elevated">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-polin-medium text-primary-foreground">ניהול מלאי רכבים</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 animate-fade-in">
        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "סה״כ רכבים", value: vehicles.length, color: "text-foreground" },
            { label: "זמינים", value: vehicles.filter(v => v.status === "available").length, color: "text-green-600" },
            { label: "שמורים", value: vehicles.filter(v => v.status === "reserved").length, color: "text-amber-600" },
            { label: "נמכרו", value: vehicles.filter(v => v.status === "sold").length, color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border shadow-card p-4">
              <div className={`text-2xl font-polin-medium ${stat.color}`}>{stat.value}</div>
              <div className="text-xs font-polin-light text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Search & Filters ── */}
        <div className="mb-5 space-y-3">
          {/* Top row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Free-text search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי מספר רישוי, יצרן או דגם..."
                value={filters.search}
                onChange={(e) => set("search")(e.target.value)}
                className="pr-10 h-10 font-polin-light"
              />
            </div>

            {/* Status */}
            <Select value={filters.status} onValueChange={set("status")}>
              <SelectTrigger className="w-[140px] h-10 font-polin-light">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="available">זמין</SelectItem>
                <SelectItem value="sold">נמכר</SelectItem>
                <SelectItem value="reserved">שמור</SelectItem>
                <SelectItem value="in_treatment">בטיפול</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvanced((p) => !p)}
              className={`h-10 font-polin-light gap-1.5 relative ${showAdvanced ? "border-primary text-primary" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              סינון מתקדם
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-polin-medium flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mr-auto">
              {isAdmin && (
                <Button onClick={() => navigate("/vehicle/new")} className="h-10 font-polin-medium bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="ml-1.5 h-4 w-4" />
                  הוספת רכב
                </Button>
              )}
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={filtered.length === 0}
                className="h-10 font-polin-medium gap-1.5"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>

          {/* Advanced panel */}
          {showAdvanced && (
            <div className="rounded-xl border bg-card shadow-card p-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Manufacturer */}
                <div className="space-y-1">
                  <label className="text-xs font-polin-medium text-muted-foreground">יצרן</label>
                  <Select value={filters.manufacturer} onValueChange={(v) => { set("manufacturer")(v); set("model")("all"); }}>
                    <SelectTrigger className="h-9 font-polin-light text-sm">
                      <SelectValue placeholder="הכל" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {options.manufacturers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div className="space-y-1">
                  <label className="text-xs font-polin-medium text-muted-foreground">דגם</label>
                  <Select value={filters.model} onValueChange={set("model")}>
                    <SelectTrigger className="h-9 font-polin-light text-sm">
                      <SelectValue placeholder="הכל" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {options.models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-1">
                  <label className="text-xs font-polin-medium text-muted-foreground">צבע</label>
                  <Select value={filters.color} onValueChange={set("color")}>
                    <SelectTrigger className="h-9 font-polin-light text-sm">
                      <SelectValue placeholder="הכל" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {options.colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch */}
                <div className="space-y-1">
                  <label className="text-xs font-polin-medium text-muted-foreground">סניף</label>
                  <Select value={filters.branch} onValueChange={set("branch")}>
                    <SelectTrigger className="h-9 font-polin-light text-sm">
                      <SelectValue placeholder="הכל" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {options.branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min price */}
                <div className="space-y-1">
                  <label className="text-xs font-polin-medium text-muted-foreground">מחיר מינימום (₪)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => set("minPrice")(e.target.value)}
                    className="h-9 font-polin-light text-sm"
                  />
                </div>

                {/* Max price */}
                <div className="space-y-1">
                  <label className="text-xs font-polin-medium text-muted-foreground">מחיר מקסימום (₪)</label>
                  <Input
                    type="number"
                    placeholder="ללא הגבלה"
                    value={filters.maxPrice}
                    onChange={(e) => set("maxPrice")(e.target.value)}
                    className="h-9 font-polin-light text-sm"
                  />
                </div>
              </div>

              {/* Active filters + clear */}
              <div className="flex items-center justify-between pt-1 border-t">
                <div className="flex flex-wrap gap-1.5">
                  {filters.manufacturer !== "all" && (
                    <Badge variant="secondary" className="font-polin-light text-xs gap-1 cursor-pointer" onClick={() => set("manufacturer")("all")}>
                      יצרן: {filters.manufacturer} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {filters.model !== "all" && (
                    <Badge variant="secondary" className="font-polin-light text-xs gap-1 cursor-pointer" onClick={() => set("model")("all")}>
                      דגם: {filters.model} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {filters.color !== "all" && (
                    <Badge variant="secondary" className="font-polin-light text-xs gap-1 cursor-pointer" onClick={() => set("color")("all")}>
                      צבע: {filters.color} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {filters.branch !== "all" && (
                    <Badge variant="secondary" className="font-polin-light text-xs gap-1 cursor-pointer" onClick={() => set("branch")("all")}>
                      סניף: {filters.branch} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {filters.minPrice && (
                    <Badge variant="secondary" className="font-polin-light text-xs gap-1 cursor-pointer" onClick={() => set("minPrice")("")}>
                      מ-₪{Number(filters.minPrice).toLocaleString()} <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {filters.maxPrice && (
                    <Badge variant="secondary" className="font-polin-light text-xs gap-1 cursor-pointer" onClick={() => set("maxPrice")("")}>
                      עד ₪{Number(filters.maxPrice).toLocaleString()} <X className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="font-polin-light text-xs text-muted-foreground hover:text-foreground gap-1">
                    <X className="h-3 w-3" /> נקה הכל
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Results count */}
          {(filters.search || filters.status !== "all" || activeFilterCount > 0) && (
            <p className="text-xs font-polin-light text-muted-foreground">
              מציג <span className="font-polin-medium text-foreground">{filtered.length}</span> מתוך {vehicles.length} רכבים
            </p>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-polin-light">טוען נתונים...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-polin-light">לא נמצאו רכבים</p>
            {activeFilterCount > 0 && (
              <Button variant="link" onClick={clearFilters} className="mt-2 font-polin-light text-sm text-muted-foreground">
                נקה פילטרים
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-polin-medium">יצרן ודגם</TableHead>
                  <TableHead className="text-right font-polin-medium">מס׳ רישוי</TableHead>
                  <TableHead className="text-right font-polin-medium">צבע</TableHead>
                  <TableHead className="text-right font-polin-medium">שנה</TableHead>
                  <TableHead className="text-right font-polin-medium">כ"ס</TableHead>
                  <TableHead className="text-right font-polin-medium">יד</TableHead>
                  <TableHead className="text-right font-polin-medium">ק"מ</TableHead>
                  <TableHead className="text-right font-polin-medium">מחיר מבוקש</TableHead>
                  <TableHead className="text-right font-polin-medium">סוג רכב</TableHead>
                  <TableHead className="text-right font-polin-medium">סוג מנוע</TableHead>
                  <TableHead className="text-right font-polin-medium">סטטוס</TableHead>
                  <TableHead className="text-right font-polin-medium">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer hover:bg-accent/5 transition-colors duration-150"
                    onClick={() => navigate(`/vehicle/${v.id}`)}
                  >
                    <TableCell className="font-polin-medium">
                      <div className="flex items-center gap-2.5">
                        <ManufacturerLogo manufacturer={v.manufacturer} size={32} />
                        <span>{[v.manufacturer, v.model].filter(Boolean).join(" ") || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-polin-light">{v.license_plate || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.color || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.year || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.horsepower || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.hand ?? "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.odometer?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell className="font-polin-medium text-primary">{v.asking_price ? `₪${v.asking_price.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="font-polin-light text-sm">
                      {(v as any).vehicle_type ? vehicleTypeLabels[(v as any).vehicle_type] ?? (v as any).vehicle_type : "—"}
                    </TableCell>
                    <TableCell className="font-polin-light text-sm">
                      {v.engine_type ? engineTypeLabels[v.engine_type] ?? v.engine_type : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-polin-medium ${statusColors[v.status || "available"]}`}>
                        {statusLabels[v.status || "available"]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${v.id}`)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(v.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
