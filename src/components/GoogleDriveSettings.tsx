import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CheckCircle, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function GoogleDriveSettings() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [folderId, setFolderId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings", "google-drive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["google_service_account_key", "google_drive_folder_id"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => (map[s.key] = s.value));
      return map;
    },
    enabled: isAdmin,
  });

  const isConnected = !!(settings?.google_service_account_key && settings?.google_drive_folder_id);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!serviceAccountKey.trim() || !folderId.trim()) {
        throw new Error("יש למלא את כל השדות");
      }
      // Validate JSON
      try {
        JSON.parse(serviceAccountKey);
      } catch {
        throw new Error("מפתח ה-Service Account חייב להיות JSON תקין");
      }

      const entries = [
        { key: "google_service_account_key", value: serviceAccountKey.trim() },
        { key: "google_drive_folder_id", value: folderId.trim() },
      ];

      for (const entry of entries) {
        const { data: existing } = await supabase
          .from("app_settings")
          .select("id")
          .eq("key", entry.key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("app_settings")
            .update({ value: entry.value, updated_by: (await supabase.auth.getUser()).data.user?.id })
            .eq("key", entry.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("app_settings")
            .insert({ key: entry.key, value: entry.value, updated_by: (await supabase.auth.getUser()).data.user?.id });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "הגדרות גוגל דרייב נשמרו בהצלחה ✓" });
      setEditing(false);
      setServiceAccountKey("");
      setFolderId("");
    },
    onError: (err: Error) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_settings")
        .delete()
        .in("key", ["google_service_account_key", "google_drive_folder_id"]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "החיבור לגוגל דרייב הוסר" });
      setEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    },
  });

  if (!isAdmin || isLoading) return null;

  return (
    <div className="bg-card rounded-xl border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Cloud className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-polin-medium text-foreground">חיבור גוגל דרייב לגיבוי</h2>
        </div>
        {isConnected && !editing && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-polin-light text-accent">
              <CheckCircle className="h-3.5 w-3.5" />
              מחובר
            </span>
          </div>
        )}
      </div>

      <div className="px-6 py-5">
        {isConnected && !editing ? (
          <div className="space-y-4">
            <p className="text-sm font-polin-light text-muted-foreground">
              החשבון מחובר לגוגל דרייב. ניתן לבצע גיבוי מדף המלאי.
            </p>
            <div className="text-xs font-polin-light text-muted-foreground">
              מזהה תיקייה: <span dir="ltr" className="font-mono">{settings.google_drive_folder_id?.slice(0, 12)}...</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  setFolderId(settings.google_drive_folder_id || "");
                }}
                className="font-polin-light"
              >
                עדכון הגדרות
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="font-polin-light text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 ml-1" />
                נתק חיבור
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-polin-light text-muted-foreground">
              חבר חשבון Google Service Account כדי לאפשר גיבוי אוטומטי של נתוני המלאי לגוגל דרייב.
            </p>

            <div className="space-y-2">
              <Label htmlFor="service-key" className="font-polin-light text-sm">
                מפתח Service Account (JSON)
              </Label>
              <div className="relative">
                <Textarea
                  id="service-key"
                  dir="ltr"
                  placeholder='{"type": "service_account", ...}'
                  value={serviceAccountKey}
                  onChange={(e) => setServiceAccountKey(e.target.value)}
                  className="font-mono text-xs min-h-[100px] pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                {!showKey && serviceAccountKey && (
                  <div className="absolute inset-0 bg-card/90 backdrop-blur-sm rounded-md flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-polin-light text-muted-foreground">לחץ על העין כדי לצפות</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-id" className="font-polin-light text-sm">
                מזהה תיקייה בגוגל דרייב
              </Label>
              <Input
                id="folder-id"
                dir="ltr"
                placeholder="1AbC2dEf3GhI4jKl5MnO"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs font-polin-light text-muted-foreground">
                ניתן למצוא את המזהה בכתובת ה-URL של התיקייה בגוגל דרייב
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !serviceAccountKey || !folderId}
                className="font-polin-light gap-2"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                שמור וחבר
              </Button>
              {editing && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setServiceAccountKey("");
                    setFolderId("");
                  }}
                  className="font-polin-light"
                >
                  ביטול
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
