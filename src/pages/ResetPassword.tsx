import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery session from the URL hash
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsRecovery(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "שגיאה", description: "הסיסמאות אינן תואמות", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "שגיאה", description: "הסיסמה חייבת להכיל לפחות 6 תווים", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הסיסמה עודכנה!", description: "מועבר לדף ההתחברות..." });
      await supabase.auth.signOut();
      setTimeout(() => navigate("/auth"), 1500);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen bg-background items-center justify-center p-8">
      <div className="w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-center mb-8">
          <img src={logoImg} alt="לוגו" className="h-24 w-auto object-contain" />
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-polin-medium text-foreground mb-2">איפוס סיסמה</h2>
          <p className="text-muted-foreground font-polin-light">הזן סיסמה חדשה לחשבונך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="font-polin-medium text-foreground">סיסמה חדשה</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="לפחות 6 תווים"
              className="h-11 font-polin-light"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-polin-medium text-foreground">אישור סיסמה</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="הזן שוב את הסיסמה"
              className="h-11 font-polin-light"
              dir="ltr"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-polin-medium text-base bg-primary hover:bg-primary/90 transition-all duration-200"
            disabled={loading}
          >
            {loading ? "מעדכן..." : "עדכן סיסמה"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/auth")}
            className="text-accent font-polin-medium text-sm hover:underline transition-all"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    </div>
  );
}
