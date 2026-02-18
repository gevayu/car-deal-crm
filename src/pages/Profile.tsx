import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Building2, Mail, ShieldCheck, Save, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().max(100, "שם לא יכול להיות ארוך מ-100 תווים").optional(),
  phone: z
    .string()
    .trim()
    .max(20, "מספר טלפון ארוך מדי")
    .regex(/^[0-9\-+\s()]*$/, "מספר טלפון לא תקין")
    .optional()
    .or(z.literal("")),
  branch: z.string().trim().max(100, "שם סניף לא יכול להיות ארוך מ-100 תווים").optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "נא להזין סיסמה נוכחית"),
    new_password: z.string().min(6, "הסיסמה החדשה חייבת להכיל לפחות 6 תווים"),
    confirm_password: z.string().min(1, "נא לאשר את הסיסמה החדשה"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirm_password"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProfileForm>({ full_name: "", phone: "", branch: "" });
  const [errors, setErrors] = useState<Partial<ProfileForm>>({});

  const [pwForm, setPwForm] = useState<PasswordForm>({ current_password: "", new_password: "", confirm_password: "" });
  const [pwErrors, setPwErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({});
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, branch")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        branch: (profile as any).branch ?? "",
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name || null,
          phone: values.phone || null,
          branch: values.branch || null,
        } as any)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({ title: "הפרופיל עודכן בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה בשמירה", variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordForm) => {
      // Re-authenticate by signing in with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: values.current_password,
      });
      if (signInError) throw new Error("הסיסמה הנוכחית שגויה");

      const { error } = await supabase.auth.updateUser({ password: values.new_password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "הסיסמה עודכנה בהצלחה" });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwErrors({});
    },
    onError: (err: Error) => {
      if (err.message === "הסיסמה הנוכחית שגויה") {
        setPwErrors({ current_password: err.message });
      } else {
        toast({ title: "שגיאה בעדכון הסיסמה", description: err.message, variant: "destructive" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<ProfileForm> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof ProfileForm;
        fieldErrors[field] = err.message as any;
      });
      setErrors(fieldErrors);
      return;
    }
    saveMutation.mutate(result.data);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrors({});
    const result = passwordSchema.safeParse(pwForm);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PasswordForm, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof PasswordForm;
        fieldErrors[field] = err.message;
      });
      setPwErrors(fieldErrors);
      return;
    }
    passwordMutation.mutate(result.data);
  };

  const Field = ({
    label, icon: Icon, name, type = "text", placeholder,
  }: {
    label: string;
    icon: React.ElementType;
    name: keyof ProfileForm;
    type?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      <Input
        type={type}
        value={form[name] ?? ""}
        onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        placeholder={placeholder}
        className="font-polin-light bg-background border-border/60 focus:border-primary text-sm"
        dir="rtl"
      />
      {errors[name] && (
        <p className="text-xs text-destructive font-polin-light">{errors[name]}</p>
      )}
    </div>
  );

  const PwField = ({
    label, name, showKey,
  }: {
    label: string;
    name: keyof PasswordForm;
    showKey: keyof typeof showPw;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div className="relative">
        <Input
          type={showPw[showKey] ? "text" : "password"}
          value={pwForm[name]}
          onChange={e => setPwForm(prev => ({ ...prev, [name]: e.target.value }))}
          className="font-polin-light bg-background border-border/60 focus:border-primary text-sm pl-10"
          dir="ltr"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPw(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPw[showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {pwErrors[name] && (
        <p className="text-xs text-destructive font-polin-light">{pwErrors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary shadow-elevated sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-4 gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-polin-medium text-primary-foreground leading-tight">פרופיל אישי</h1>
            <p className="text-xs font-polin-light text-primary-foreground/60">עדכן את פרטי החשבון שלך</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6 animate-fade-in">
        {isLoading ? (
          <div className="py-32 text-center text-muted-foreground font-polin-light">טוען...</div>
        ) : (
          <>
            {/* Account info (read-only) */}
            <div className="bg-card rounded-2xl border shadow-card p-6 space-y-4">
              <h2 className="font-polin-medium text-foreground text-base border-b border-border/50 pb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                פרטי חשבון
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    אימייל
                  </Label>
                  <div className="rounded-md border border-border/40 bg-muted/40 px-3 py-2 text-sm font-polin-light text-muted-foreground" dir="ltr">
                    {user?.email}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-polin-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    תפקיד
                  </Label>
                  <div className="rounded-md border border-border/40 bg-muted/40 px-3 py-2 flex items-center">
                    <Badge className="bg-primary text-primary-foreground font-polin-medium border-0 text-xs">
                      {isAdmin ? "מנהל" : "איש מכירות"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable profile */}
            <form onSubmit={handleSubmit}>
              <div className="bg-card rounded-2xl border shadow-card p-6 space-y-5">
                <h2 className="font-polin-medium text-foreground text-base border-b border-border/50 pb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  פרטים אישיים
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="שם מלא" icon={User} name="full_name" placeholder="ישראל ישראלי" />
                  <Field label="מספר טלפון" icon={Phone} name="phone" type="tel" placeholder="050-0000000" />
                  <Field label="סניף" icon={Building2} name="branch" placeholder="תל אביב" />
                </div>

                <div className="flex justify-start pt-2">
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-polin-medium gap-2 px-6"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? "שומר..." : "שמור שינויים"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handlePasswordSubmit}>
              <div className="bg-card rounded-2xl border shadow-card p-6 space-y-5">
                <h2 className="font-polin-medium text-foreground text-base border-b border-border/50 pb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  שינוי סיסמה
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <PwField label="סיסמה נוכחית" name="current_password" showKey="current" />
                  </div>
                  <PwField label="סיסמה חדשה" name="new_password" showKey="new" />
                  <PwField label="אימות סיסמה חדשה" name="confirm_password" showKey="confirm" />
                </div>
                <p className="text-xs font-polin-light text-muted-foreground">הסיסמה חייבת להכיל לפחות 6 תווים</p>
                <div className="flex justify-start pt-1">
                  <Button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-polin-medium gap-2 px-6"
                  >
                    <Lock className="h-4 w-4" />
                    {passwordMutation.isPending ? "מעדכן..." : "עדכן סיסמה"}
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
