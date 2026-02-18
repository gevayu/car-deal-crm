import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, ArrowRight, Users, ShieldCheck, UserRound,
  Mail, Phone, Clock, RefreshCw,
} from "lucide-react";

interface UserEntry {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "sales";
  full_name: string;
  phone: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UsersManagement() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [changingId, setChangingId] = useState<string | null>(null);

  const { data: users = [], isLoading, refetch, isFetching } = useQuery<UserEntry[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
        { headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "שגיאה בטעינת משתמשים");
      return json.users as UserEntry[];
    },
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "sales" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "התפקיד עודכן בהצלחה ✓" });
      setChangingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
      setChangingId(null);
    },
  });

  if (!isAdmin) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground font-polin-light">אין לך הרשאה לצפות בדף זה</p>
      </div>
    );
  }

  const admins = users.filter((u) => u.role === "admin");
  const sales = users.filter((u) => u.role === "sales");

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary shadow-elevated sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-polin-medium text-primary-foreground">ניהול משתמשים</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-polin-light text-primary-foreground/70 hidden sm:block">{user?.email}</span>
            <Badge className="bg-accent text-accent-foreground font-polin-medium border-0">מנהל</Badge>
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate("/")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 font-polin-light gap-1.5"
            >
              <ArrowRight className="h-4 w-4" />
              למלאי
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "סה״כ משתמשים", value: users.length, icon: Users, color: "text-primary" },
            { label: "מנהלים", value: admins.length, icon: ShieldCheck, color: "text-accent" },
            { label: "אנשי מכירות", value: sales.length, icon: UserRound, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border shadow-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-polin-medium ${s.color}`}>{s.value}</div>
                <div className="text-xs font-polin-light text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Users list */}
        <div className="bg-card rounded-xl border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <h2 className="font-polin-medium text-foreground">רשימת משתמשים</h2>
            <Button
              variant="ghost" size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="font-polin-light gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              רענן
            </Button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground font-polin-light">טוען משתמשים...</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground font-polin-light">לא נמצאו משתמשים</div>
          ) : (
            <div className="divide-y">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors hover:bg-muted/20 ${
                    u.id === user?.id ? "bg-accent/5" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-polin-medium text-sm">
                      {(u.full_name || u.email || "?")[0].toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-polin-medium text-foreground text-sm">
                        {u.full_name || "—"}
                      </span>
                      {u.id === user?.id && (
                        <Badge variant="outline" className="text-xs font-polin-light">אתה</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1 text-xs font-polin-light text-muted-foreground">
                        <Mail className="h-3 w-3" />{u.email}
                      </span>
                      {u.phone && (
                        <span className="flex items-center gap-1 text-xs font-polin-light text-muted-foreground">
                          <Phone className="h-3 w-3" />{u.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-polin-light text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        כניסה אחרונה: {formatDate(u.last_sign_in_at)}
                      </span>
                      <span className="text-xs font-polin-light text-muted-foreground">
                        נרשם: {formatDate(u.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div className="flex items-center gap-3">
                    <Select
                      value={u.role}
                      disabled={u.id === user?.id || changingId === u.id || updateRoleMutation.isPending}
                      onValueChange={(newRole) => {
                        setChangingId(u.id);
                        updateRoleMutation.mutate({ userId: u.id, newRole: newRole as "admin" | "sales" });
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-9 font-polin-light text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                            מנהל
                          </span>
                        </SelectItem>
                        <SelectItem value="sales">
                          <span className="flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                            איש מכירות
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Role badge */}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-polin-medium ${
                      u.role === "admin"
                        ? "bg-accent/15 text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {u.role === "admin"
                        ? <><ShieldCheck className="h-3 w-3" />מנהל</>
                        : <><UserRound className="h-3 w-3" />מכירות</>
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs font-polin-light text-muted-foreground text-center">
          שינוי תפקיד נכנס לתוקף בכניסה הבאה של המשתמש למערכת
        </p>
      </main>
    </div>
  );
}
