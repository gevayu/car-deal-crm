import { useState } from "react";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Car, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

export default function Inventory() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

    // Set column widths
    ws["!cols"] = Array(Object.keys(rows[0] || {}).length).fill({ wch: 18 });

    XLSX.writeFile(wb, `מלאי_רכבים_${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.xlsx`);
    toast({ title: "הקובץ יוצא בהצלחה", description: `${filtered.length} רכבים יוצאו לאקסל` });
  };

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

  const filtered = vehicles.filter((v) => {
    const matchSearch = !search || (v.license_plate?.includes(search) ?? false);
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

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

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי מספר רישוי..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-10 font-polin-light"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-10 font-polin-light">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="available">זמין</SelectItem>
              <SelectItem value="sold">נמכר</SelectItem>
              <SelectItem value="reserved">שמור</SelectItem>
              <SelectItem value="in_treatment">בטיפול</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={() => navigate("/vehicle/new")} className="h-10 font-polin-medium bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="ml-2 h-4 w-4" />
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
            ייצוא Excel
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground font-polin-light">טוען נתונים...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-polin-light">לא נמצאו רכבים</p>
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
                    <TableCell className="font-polin-medium">{[v.manufacturer, v.model].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.license_plate || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.color || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.year || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.horsepower || "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.hand ?? "—"}</TableCell>
                    <TableCell className="font-polin-light">{v.odometer?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell className="font-polin-medium text-primary">{v.asking_price ? `₪${v.asking_price.toLocaleString()}` : "—"}</TableCell>
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
