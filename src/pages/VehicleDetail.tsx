import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Save, Upload, Images, ClipboardCheck, ExternalLink, Trash2, Car, FileText, Wrench, Banknote, Info, Plus, X } from "lucide-react";
import ManufacturerLogo from "@/components/ManufacturerLogo";
import VehiclePrintView from "@/components/VehiclePrintView";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import VehicleGallery from "@/components/VehicleGallery";

type Vehicle = Tables<"vehicles">;

const emptyVehicle: Partial<TablesInsert<"vehicles">> = {
  license_plate: "", chassis_number: "", model_code: "", engine_number: "", code: "",
  manufacturer: "", model: "", trim_level: "", year: undefined, engine_type: "",
  engine_volume: "", horsepower: "", transmission: "", color: "", seats: undefined, doors: undefined,
  hand: undefined, is_original: true, odometer: undefined, test_date: undefined,
  registration_fee: undefined, needs_route: false, is_pledged: false,
  deal_type: "regular_sale", status: "available",
  list_price: undefined, weighted_list_price: undefined, asking_price: undefined,
  purchase_price: undefined, expenses: undefined,
  branch: "", salesperson: "", notes: "",
};

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>(emptyVehicle);
  const [photos, setPhotos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ name: string; url: string; path: string }[]>([]);
  const [inspectionFile, setInspectionFile] = useState<{ name: string; url: string; path: string } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingInspection, setUploadingInspection] = useState(false);
  const [newExpense, setNewExpense] = useState({ expense_date: "", amount: "", description: "" });
  const [addingExpense, setAddingExpense] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (vehicle) setForm(vehicle);
  }, [vehicle]);

  // Load photos, docs & inspection
  useEffect(() => {
    if (isNew || !id) return;
    const loadFiles = async () => {
      const { data: photoFiles } = await supabase.storage.from("vehicle-photos").list(id);
      if (photoFiles) {
        setPhotos(photoFiles.map(f => supabase.storage.from("vehicle-photos").getPublicUrl(`${id}/${f.name}`).data.publicUrl));
      }
      const { data: docFiles } = await supabase.storage.from("vehicle-documents").list(id);
      if (docFiles) {
        const generalFiles = docFiles.filter(f => !f.name.startsWith("inspection_"));
        const inspectionItem = docFiles.find(f => f.name.startsWith("inspection_"));
        // Get signed URLs for documents
        const docsWithUrls = await Promise.all(generalFiles.map(async (f) => {
          const { data } = await supabase.storage.from("vehicle-documents").createSignedUrl(`${id}/${f.name}`, 3600);
          return { name: f.name, url: data?.signedUrl ?? "", path: `${id}/${f.name}` };
        }));
        setDocuments(docsWithUrls);
        if (inspectionItem) {
          const { data } = await supabase.storage.from("vehicle-documents").createSignedUrl(`${id}/${inspectionItem.name}`, 3600);
          setInspectionFile({ name: inspectionItem.name, url: data?.signedUrl ?? "", path: `${id}/${inspectionItem.name}` });
        }
      }
    };
    loadFiles();
  }, [id, isNew]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (isNew) {
        const { error } = await supabase.from("vehicles").insert({ ...data, created_by: user?.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").update(data).eq("id", id!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({ title: isNew ? "הרכב נוסף בהצלחה!" : "הרכב עודכן בהצלחה!" });
      if (isNew) navigate("/");
    },
    onError: (err: Error) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    },
  });

  // Expenses
  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ["vehicle_expenses", id],
    queryFn: async () => {
      if (isNew || !id) return [];
      const { data, error } = await supabase
        .from("vehicle_expenses" as any)
        .select("*")
        .eq("vehicle_id", id)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data as unknown) as { id: string; expense_date: string; amount: number; description: string }[];
    },
    enabled: !isNew && !!id,
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicle_expenses" as any).insert({
        vehicle_id: id,
        expense_date: newExpense.expense_date || new Date().toISOString().slice(0, 10),
        amount: Number(newExpense.amount) || 0,
        description: newExpense.description,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewExpense({ expense_date: "", amount: "", description: "" });
      setAddingExpense(false);
      refetchExpenses();
    },
    onError: (err: Error) => toast({ title: "שגיאה", description: err.message, variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase.from("vehicle_expenses" as any).delete().eq("id", expenseId);
      if (error) throw error;
    },
    onSuccess: () => refetchExpenses(),
    onError: (err: Error) => toast({ title: "שגיאה", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { id: _id, created_at, updated_at, ...rest } = form;
    saveMutation.mutate(rest);
  };

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const renderField = (label: string, name: string, type = "text") => (
    <div className="space-y-1.5">
      <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input
        type={type}
        value={form[name] ?? ""}
        onChange={(e) => set(name, type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value)}
        disabled={!isAdmin}
        className="font-polin-light h-10"
      />
    </div>
  );

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card rounded-2xl border shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-polin-medium text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const STATUS_COLORS: Record<string, string> = {
    available: "bg-green-100 text-green-700 border border-green-200",
    sold: "bg-red-100 text-red-700 border border-red-200",
    reserved: "bg-amber-100 text-amber-700 border border-amber-200",
    in_treatment: "bg-blue-100 text-blue-700 border border-blue-200",
  };
  const STATUS_LABELS: Record<string, string> = {
    available: "זמין", sold: "נמכר", reserved: "שמור", in_treatment: "בטיפול",
  };

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-gradient-gold mx-auto flex items-center justify-center animate-pulse">
          <Car className="h-6 w-6 text-primary" />
        </div>
        <p className="font-polin-light text-muted-foreground">טוען כרטיס רכב...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="border-b bg-primary shadow-elevated sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/")}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </button>
            <div className="flex items-center gap-3">
              {!isNew && form.manufacturer && (
                <ManufacturerLogo manufacturer={form.manufacturer} size={38} />
              )}
              <div>
                <h1 className="text-lg font-polin-medium text-primary-foreground leading-tight">
                  {isNew ? "הוספת רכב חדש" : [form.manufacturer, form.model].filter(Boolean).join(" ") || "כרטיס רכב"}
                </h1>
                {!isNew && form.license_plate && (
                  <p className="text-xs font-polin-light text-primary-foreground/60">{form.license_plate}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isNew && form.status && (
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-polin-medium ${STATUS_COLORS[form.status] ?? ""}`}>
                {STATUS_LABELS[form.status] ?? form.status}
              </span>
            )}
            {!isNew && (
              <VehiclePrintView vehicle={form} agentName={user?.email ?? ""} />
            )}
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-6 animate-fade-in">

          {/* ── Identification ── */}
          <Section title="פרטי זיהוי" icon={FileText}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {renderField("מספר רישוי", "license_plate")}
              {renderField("מספר שלדה", "chassis_number")}
              {renderField("קוד דגם", "model_code")}
              {renderField("מספר מנוע", "engine_number")}
              {renderField("קוד הנעה", "code")}
            </div>
          </Section>

          {/* ── Specs ── */}
          <Section title="מאפייני רכב" icon={Car}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {renderField("יצרן", "manufacturer")}
              {renderField("דגם", "model")}
              {renderField("רמת גימור", "trim_level")}
              {renderField("שנה", "year", "number")}
              <div className="space-y-1.5">
                <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">סוג מנוע</Label>
                <Select value={form.engine_type || ""} onValueChange={(v) => set("engine_type", v || null)} disabled={!isAdmin}>
                  <SelectTrigger className="h-10 font-polin-light"><SelectValue placeholder="בחר סוג מנוע" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">בנזין</SelectItem>
                    <SelectItem value="diesel">דיזל</SelectItem>
                    <SelectItem value="hybrid">היברידי</SelectItem>
                    <SelectItem value="plugin_hybrid">היברידי פלאג-אין</SelectItem>
                    <SelectItem value="electric">חשמלי</SelectItem>
                    <SelectItem value="lpg">גז (LPG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderField("נפח מנוע", "engine_volume")}
              {renderField("כוחות סוס", "horsepower")}
              {renderField("תיבת הילוכים", "transmission")}
              {renderField("צבע", "color")}
              {renderField("מקומות ישיבה", "seats", "number")}
              {renderField("מספר דלתות", "doors", "number")}
            </div>
          </Section>

          {/* ── Condition ── */}
          <Section title="מצב הרכב" icon={Wrench}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {renderField("יד", "hand", "number")}
              {renderField('מד אוץ (ק"מ)', "odometer", "number")}
              {renderField("טסט", "test_date", "date")}
              {renderField("אגרת רישוי", "registration_fee", "number")}
              <div className="flex flex-col gap-3 pt-1">
                {[
                  { id: "original", key: "is_original", label: "מקורי", default: true },
                  { id: "route", key: "needs_route", label: "צריך מסלול", default: false },
                  { id: "pledged", key: "is_pledged", label: "משועבד", default: false },
                ].map(cb => (
                  <label key={cb.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      id={cb.id}
                      checked={form[cb.key] ?? cb.default}
                      onCheckedChange={(c) => set(cb.key, c)}
                      disabled={!isAdmin}
                    />
                    <span className="text-sm font-polin-light text-foreground group-hover:text-primary transition-colors">{cb.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Deal ── */}
          <Section title="פרטי עסקה" icon={Banknote}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">סוג רכב</Label>
                <Select value={form.vehicle_type || ""} onValueChange={(v) => set("vehicle_type", v || null)} disabled={!isAdmin}>
                  <SelectTrigger className="h-10 font-polin-light"><SelectValue placeholder="בחר סוג רכב" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">רכב קטן</SelectItem>
                    <SelectItem value="family">משפחתי</SelectItem>
                    <SelectItem value="executive">מנהלים</SelectItem>
                    <SelectItem value="suv">SUV / ג'יפ</SelectItem>
                    <SelectItem value="van">ואן / מסחרי</SelectItem>
                    <SelectItem value="truck">משאית / פיקאפ</SelectItem>
                    <SelectItem value="electric">חשמלי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">סוג עסקה</Label>
                <Select value={form.deal_type || "regular_sale"} onValueChange={(v) => set("deal_type", v)} disabled={!isAdmin}>
                  <SelectTrigger className="h-10 font-polin-light"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_sale">מכירה רגילה</SelectItem>
                    <SelectItem value="brokerage">תיווך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">סטטוס</Label>
                <Select value={form.status || "available"} onValueChange={(v) => set("status", v)} disabled={!isAdmin}>
                  <SelectTrigger className="h-10 font-polin-light"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">זמין</SelectItem>
                    <SelectItem value="sold">נמכר</SelectItem>
                    <SelectItem value="reserved">שמור</SelectItem>
                    <SelectItem value="in_treatment">בטיפול</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderField("מחיר מחירון דגם", "list_price", "number")}
              {renderField("מחירון משוקלל", "weighted_list_price", "number")}
              {renderField("מחיר מבוקש", "asking_price", "number")}
              {renderField("מחיר קניה", "purchase_price", "number")}
            </div>
            {/* Price summary bar – always visible when any price field exists */}
            {(form.asking_price != null || form.purchase_price != null) && (() => {
              const asking = form.asking_price ?? 0;
              const cost = (form.purchase_price ?? 0) + totalExpenses + (form.registration_fee ?? 0);
              const gross = asking - cost;
              const hasProfit = gross !== 0;
              const isProfit = gross > 0;
              return (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3 text-center bg-primary">
                      <p className="text-xs font-polin-light mb-0.5 text-primary-foreground/70">מחיר מבוקש</p>
                      <p className="text-base font-polin-medium text-accent">₪{Number(asking).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl p-3 text-center bg-muted">
                      <p className="text-xs font-polin-light mb-0.5 text-muted-foreground">עלות כוללת</p>
                      <p className="text-base font-polin-medium text-foreground">₪{Number(cost).toLocaleString()}</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center border-2 ${hasProfit ? (isProfit ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200") : "bg-muted border-transparent"}`}>
                      <p className={`text-xs font-polin-light mb-0.5 ${hasProfit ? (isProfit ? "text-green-600" : "text-red-500") : "text-muted-foreground"}`}>רווח גולמי</p>
                      <p className={`text-base font-polin-medium ${hasProfit ? (isProfit ? "text-green-700" : "text-red-600") : "text-foreground"}`}>
                        {isProfit ? "+" : ""}₪{Number(gross).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {cost > 0 && asking > 0 && (
                    <div className="flex items-center gap-2 text-xs font-polin-light text-muted-foreground px-1">
                      <span>עלות כוללת = מחיר קניה</span>
                      {totalExpenses > 0 ? <span>+ הוצאות (₪{totalExpenses.toLocaleString()})</span> : null}
                      {form.registration_fee ? <span>+ אגרת רישוי (₪{Number(form.registration_fee).toLocaleString()})</span> : null}
                    </div>
                  )}
                </div>
              );
            })()}
          </Section>

          {/* ── Expenses ── */}
          {!isNew && (
            <div className="bg-card rounded-2xl border shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-polin-medium text-foreground">הוצאות</h2>
                  {totalExpenses > 0 && (
                    <span className="text-xs font-polin-light text-muted-foreground">
                      סה"כ: <span className="font-polin-medium text-foreground">₪{totalExpenses.toLocaleString()}</span>
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <Button type="button" size="sm" variant="outline"
                    className="gap-1.5 font-polin-light text-xs h-8"
                    onClick={() => setAddingExpense(true)}>
                    <Plus className="h-3.5 w-3.5" />הוסף הוצאה
                  </Button>
                )}
              </div>
              <div className="p-6 space-y-3">
                {/* Add expense form */}
                {addingExpense && isAdmin && (
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                    <p className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">הוצאה חדשה</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-polin-medium text-muted-foreground">תאריך</Label>
                        <Input type="date" value={newExpense.expense_date}
                          onChange={e => setNewExpense(p => ({ ...p, expense_date: e.target.value }))}
                          className="h-9 font-polin-light" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-polin-medium text-muted-foreground">סכום (₪)</Label>
                        <Input type="number" placeholder="0" value={newExpense.amount}
                          onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                          className="h-9 font-polin-light" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-polin-medium text-muted-foreground">פירוט</Label>
                        <Input type="text" placeholder="תיאור ההוצאה" value={newExpense.description}
                          onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
                          className="h-9 font-polin-light" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" className="text-xs font-polin-light gap-1"
                        onClick={() => { setAddingExpense(false); setNewExpense({ expense_date: "", amount: "", description: "" }); }}>
                        <X className="h-3.5 w-3.5" />ביטול
                      </Button>
                      <Button type="button" size="sm"
                        className="text-xs font-polin-medium gap-1 bg-primary hover:bg-primary/90"
                        disabled={addExpenseMutation.isPending || !newExpense.amount}
                        onClick={() => addExpenseMutation.mutate()}>
                        <Plus className="h-3.5 w-3.5" />
                        {addExpenseMutation.isPending ? "שומר..." : "שמור הוצאה"}
                      </Button>
                    </div>
                  </div>
                )}
                {/* Expenses list */}
                {expenses.length === 0 && !addingExpense ? (
                  <p className="text-sm font-polin-light text-muted-foreground">לא נרשמו הוצאות לרכב זה</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-polin-light text-muted-foreground min-w-[80px]" dir="ltr">
                            {exp.expense_date}
                          </span>
                          <span className="font-polin-medium text-foreground text-sm">
                            ₪{Number(exp.amount).toLocaleString()}
                          </span>
                          <span className="text-sm font-polin-light text-muted-foreground">{exp.description}</span>
                        </div>
                        {isAdmin && (
                          <button type="button"
                            onClick={() => deleteExpenseMutation.mutate(exp.id)}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Additional ── */}
          <Section title="מידע נוסף" icon={Info}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {renderField("סניף", "branch")}
              {renderField("תאריך כניסה למלאי", "entry_date", "date")}
              {renderField("איש מכירות", "salesperson")}
              <div className="col-span-full space-y-1.5">
                <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide">הערות</Label>
                <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
                  disabled={!isAdmin} rows={3} className="font-polin-light resize-none" />
              </div>
            </div>
          </Section>

          {/* ── Gallery ── */}
          {!isNew && (
            <div className="bg-card rounded-2xl border shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Images className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="font-polin-medium text-foreground">גלריית תמונות</h2>
                </div>
                {photos.length > 0 && (
                  <Badge className="bg-accent/15 text-accent-foreground border-0 font-polin-light text-xs">
                    {photos.length} תמונות
                  </Badge>
                )}
              </div>
              <div className="p-6">
                <VehicleGallery vehicleId={id!} photos={photos} onPhotosChange={setPhotos} isAdmin={isAdmin} />
              </div>
            </div>
          )}

          {/* ── Inspection ── */}
          {!isNew && (
            <div className="bg-card rounded-2xl border border-accent/25 shadow-card overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-accent/5">
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-accent" />
                </div>
                <h2 className="font-polin-medium text-foreground">בדיקת רכב</h2>
                {inspectionFile && (
                  <Badge variant="outline" className="font-polin-light text-xs border-green-300 text-green-700 mr-auto">קובץ מצורף ✓</Badge>
                )}
              </div>
              <div className="p-6 space-y-4">
                {inspectionFile ? (
                  <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-polin-medium text-foreground truncate max-w-[240px]">
                          {inspectionFile.name.replace(/^inspection_\d+_/, "")}
                        </p>
                        <p className="text-xs font-polin-light text-muted-foreground">קובץ בדיקת רכב</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inspectionFile.url && (
                        <a href={inspectionFile.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-polin-medium text-primary hover:text-accent transition-colors px-3 py-1.5 rounded-lg border hover:border-accent/50">
                          <ExternalLink className="h-3.5 w-3.5" />פתח
                        </a>
                      )}
                      {isAdmin && (
                        <button type="button"
                          onClick={async () => {
                            const { error } = await supabase.storage.from("vehicle-documents").remove([inspectionFile.path]);
                            if (!error) setInspectionFile(null);
                          }}
                          className="flex items-center gap-1.5 text-xs font-polin-light text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-lg border border-destructive/20 hover:border-destructive/40">
                          <Trash2 className="h-3.5 w-3.5" />מחק
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-polin-light text-muted-foreground">לא צורף קובץ בדיקה לרכב זה</p>
                )}
                {isAdmin && (
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-polin-medium transition-colors ${
                    uploadingInspection ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-accent/10 border-accent/30 text-accent-foreground hover:bg-accent/20"}`}>
                    <Upload className="h-4 w-4" />
                    {uploadingInspection ? "מעלה..." : inspectionFile ? "החלף קובץ בדיקה" : "העלה קובץ בדיקה"}
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                      disabled={uploadingInspection}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingInspection(true);
                        if (inspectionFile) await supabase.storage.from("vehicle-documents").remove([inspectionFile.path]);
                        const path = `${id}/inspection_${Date.now()}_${file.name}`;
                        const { error } = await supabase.storage.from("vehicle-documents").upload(path, file, { contentType: file.type });
                        setUploadingInspection(false);
                        if (error) { toast({ title: "שגיאה בהעלאת קובץ", description: error.message, variant: "destructive" }); return; }
                        const { data: signed } = await supabase.storage.from("vehicle-documents").createSignedUrl(path, 3600);
                        setInspectionFile({ name: `inspection_${Date.now()}_${file.name}`, url: signed?.signedUrl ?? "", path });
                      }} />
                  </label>
                )}
                <p className="text-xs font-polin-light text-muted-foreground">פורמטים מקובלים: PDF, Word, תמונה</p>
              </div>
            </div>
          )}

          {/* ── Documents ── */}
          {!isNew && (
            <div className="bg-card rounded-2xl border shadow-card overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-polin-medium text-foreground">מסמכי הרכב</h2>
              </div>
              <div className="p-6 space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-polin-light">אין מסמכים נוספים</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">📄</span>
                          <span className="text-sm font-polin-light text-foreground">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs font-polin-medium text-primary hover:text-accent transition-colors flex items-center gap-1 px-2 py-1 rounded-md border hover:border-accent/40">
                              <ExternalLink className="h-3 w-3" />פתח
                            </a>
                          )}
                          {isAdmin && (
                            <button type="button" onClick={async () => {
                              await supabase.storage.from("vehicle-documents").remove([doc.path]);
                              setDocuments(prev => prev.filter((_, j) => j !== i));
                            }} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-polin-light hover:bg-muted transition-colors mt-1">
                    <Upload className="h-4 w-4" />
                    {uploadingDoc ? "מעלה..." : "העלאת מסמך"}
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" className="hidden" disabled={uploadingDoc}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingDoc(true);
                        const path = `${id}/${Date.now()}_${file.name}`;
                        const { error } = await supabase.storage.from("vehicle-documents").upload(path, file, { contentType: file.type });
                        setUploadingDoc(false);
                        if (error) { toast({ title: "שגיאה בהעלאת קובץ", description: error.message, variant: "destructive" }); return; }
                        const { data: signed } = await supabase.storage.from("vehicle-documents").createSignedUrl(path, 3600);
                        setDocuments(prev => [...prev, { name: file.name, url: signed?.signedUrl ?? "", path }]);
                      }} />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* bottom padding for sticky bar */}
          <div className="h-6" />
        </div>

        {/* ── Sticky Save Bar ── */}
        {isAdmin && (
          <div className="sticky bottom-0 z-20 border-t bg-card/95 backdrop-blur-sm shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
            <div className="px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
              <p className="text-xs font-polin-light text-muted-foreground">
                {isNew ? "מלא את הפרטים ולחץ שמירה להוספת הרכב" : "שנה פרטים ולחץ שמירה לעדכון"}
              </p>
              <Button type="submit" disabled={saveMutation.isPending}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-polin-medium gap-2 px-6 shadow-card">
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "שומר..." : isNew ? "הוסף רכב" : "שמור שינויים"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
