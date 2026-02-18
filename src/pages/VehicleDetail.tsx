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
import { ArrowRight, Save, Upload, Images } from "lucide-react";
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
  const [documents, setDocuments] = useState<string[]>([]);
  

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

  // Load photos & docs
  useEffect(() => {
    if (isNew || !id) return;
    const loadFiles = async () => {
      const { data: photoFiles } = await supabase.storage.from("vehicle-photos").list(id);
      if (photoFiles) {
        setPhotos(photoFiles.map(f => supabase.storage.from("vehicle-photos").getPublicUrl(`${id}/${f.name}`).data.publicUrl));
      }
      const { data: docFiles } = await supabase.storage.from("vehicle-documents").list(id);
      if (docFiles) {
        setDocuments(docFiles.map(f => f.name));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { id: _id, created_at, updated_at, ...rest } = form;
    saveMutation.mutate(rest);
  };

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const Field = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={form[name] ?? ""}
        onChange={(e) => set(name, type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value)}
        disabled={!isAdmin}
      />
    </div>
  );

  if (isLoading) return <div dir="rtl" className="flex min-h-screen items-center justify-center">טוען...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{isNew ? "הוספת רכב חדש" : `כרטיס רכב — ${form.manufacturer || ""} ${form.model || ""}`}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identification */}
          <Card>
            <CardHeader><CardTitle className="text-lg">פרטי זיהוי</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="מספר רישוי" name="license_plate" />
              <Field label="מספר שלדה" name="chassis_number" />
              <Field label="קוד דגם" name="model_code" />
              <Field label="מספר מנוע" name="engine_number" />
              <Field label="קוד" name="code" />
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader><CardTitle className="text-lg">מאפייני רכב</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="יצרן" name="manufacturer" />
              <Field label="דגם" name="model" />
              <Field label="רמת גימור" name="trim_level" />
              <Field label="שנה" name="year" type="number" />
              <Field label="סוג מנוע" name="engine_type" />
              <Field label="נפח מנוע" name="engine_volume" />
              <Field label="כוחות סוס" name="horsepower" />
              <Field label="תיבת הילוכים" name="transmission" />
              <Field label="צבע" name="color" />
              <Field label="מקומות ישיבה" name="seats" type="number" />
              <Field label="מספר דלתות" name="doors" type="number" />
            </CardContent>
          </Card>

          {/* Condition */}
          <Card>
            <CardHeader><CardTitle className="text-lg">מצב הרכב</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="יד" name="hand" type="number" />
              <Field label="מד אוץ (ק״מ)" name="odometer" type="number" />
              <Field label="טסט" name="test_date" type="date" />
              <Field label="אגרת רישוי" name="registration_fee" type="number" />
              <div className="flex items-center gap-2 pt-6">
                <Checkbox checked={form.is_original ?? true} onCheckedChange={(c) => set("is_original", c)} disabled={!isAdmin} id="original" />
                <Label htmlFor="original">מקורי</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox checked={form.needs_route ?? false} onCheckedChange={(c) => set("needs_route", c)} disabled={!isAdmin} id="route" />
                <Label htmlFor="route">צריך מסלול</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox checked={form.is_pledged ?? false} onCheckedChange={(c) => set("is_pledged", c)} disabled={!isAdmin} id="pledged" />
                <Label htmlFor="pledged">משועבד</Label>
              </div>
            </CardContent>
          </Card>

          {/* Deal */}
          <Card>
            <CardHeader><CardTitle className="text-lg">פרטי עסקה</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">סוג עסקה</Label>
                <Select value={form.deal_type || "regular_sale"} onValueChange={(v) => set("deal_type", v)} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_sale">מכירה רגילה</SelectItem>
                    <SelectItem value="brokerage">תיווך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">סטטוס</Label>
                <Select value={form.status || "available"} onValueChange={(v) => set("status", v)} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">זמין</SelectItem>
                    <SelectItem value="sold">נמכר</SelectItem>
                    <SelectItem value="reserved">שמור</SelectItem>
                    <SelectItem value="in_treatment">בטיפול</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="מחיר מחירון דגם" name="list_price" type="number" />
              <Field label="מחירון משוקלל" name="weighted_list_price" type="number" />
              <Field label="מחיר מבוקש" name="asking_price" type="number" />
              <Field label="מחיר קניה" name="purchase_price" type="number" />
              <Field label="הוצאות" name="expenses" type="number" />
            </CardContent>
          </Card>

          {/* Additional */}
          <Card>
            <CardHeader><CardTitle className="text-lg">מידע נוסף</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field label="סניף" name="branch" />
              <Field label="תאריך כניסה למלאי" name="entry_date" type="date" />
              <Field label="איש מכירות" name="salesperson" />
              <div className="col-span-full space-y-1">
                <Label className="text-xs text-muted-foreground">הערות</Label>
                <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} disabled={!isAdmin} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Photos Gallery */}
          {!isNew && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Images className="h-5 w-5 text-accent" />
                  גלריית תמונות
                  {photos.length > 0 && (
                    <Badge className="bg-accent/15 text-accent-foreground border-0 font-polin-light text-xs">
                      {photos.length} תמונות
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VehicleGallery
                  vehicleId={id!}
                  photos={photos}
                  onPhotosChange={setPhotos}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {!isNew && (
            <Card>
              <CardHeader><CardTitle className="text-lg">מסמכים</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  {documents.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span>📄</span>
                      <span className="font-polin-light">{name}</span>
                    </div>
                  ))}
                  {documents.length === 0 && <p className="text-sm text-muted-foreground font-polin-light">אין מסמכים</p>}
                </div>
                {isAdmin && (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm hover:bg-muted font-polin-light">
                    <Upload className="h-4 w-4" />
                    העלאת מסמך
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const path = `${id}/${Date.now()}_${file.name}`;
                        const { error } = await supabase.storage.from("vehicle-documents").upload(path, file);
                        if (!error) setDocuments(prev => [...prev, file.name]);
                      }}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={saveMutation.isPending}>
                <Save className="ml-2 h-4 w-4" />
                {saveMutation.isPending ? "שומר..." : "שמירה"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
