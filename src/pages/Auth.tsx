import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password, fullName)
      : await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else if (isSignUp) {
      toast({ title: "נרשמת בהצלחה!", description: "בדוק את האימייל לאישור החשבון." });
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen bg-background">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 right-16 w-64 h-64 rounded-full border-2 border-gold" />
          <div className="absolute top-32 right-32 w-40 h-40 rounded-full border border-gold" />
          <div className="absolute bottom-24 left-16 w-80 h-80 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-48 left-48 w-32 h-32 rounded-full border border-white/20" />
        </div>

        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <img src={logoImg} alt="לוגו" className="h-12 w-auto object-contain" />
          </div>
        </div>

        <div className="relative z-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-5xl font-polin-medium text-white leading-tight mb-6">
            ניהול מלאי
            <br />
            <span className="text-gold">חכם ויעיל</span>
          </h1>
          <p className="text-white/70 font-polin-light text-lg leading-relaxed max-w-sm">
            מערכת מתקדמת לניהול רכבים, עסקאות ולקוחות — הכל במקום אחד.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {[
            { label: "ניהול מלאי", desc: "מעקב מלא" },
            { label: "תמונות ומסמכים", desc: "אחסון מאובטח" },
            { label: "הרשאות", desc: "שליטה מלאה" },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-gold font-polin-medium text-sm mb-1">{item.label}</div>
              <div className="text-white/60 font-polin-light text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src={logoImg} alt="לוגו" className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-polin-medium text-foreground mb-2">
              {isSignUp ? "יצירת חשבון" : "ברוך הבא"}
            </h2>
            <p className="text-muted-foreground font-polin-light">
              {isSignUp ? "מלא את הפרטים כדי להתחיל" : "התחבר כדי להמשיך"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="fullName" className="font-polin-medium text-foreground">שם מלא</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="ישראל ישראלי"
                  className="h-11 font-polin-light"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-polin-medium text-foreground">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="h-11 font-polin-light"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-polin-medium text-foreground">סיסמה</Label>
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

            <Button
              type="submit"
              className="w-full h-11 font-polin-medium text-base bg-primary hover:bg-primary/90 transition-all duration-200 animate-pulse-gold"
              disabled={loading}
            >
              {loading ? "טוען..." : isSignUp ? "הרשמה" : "התחברות"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-muted-foreground font-polin-light text-sm">
              {isSignUp ? "כבר יש לך חשבון?" : "אין לך חשבון?"}
            </span>{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-accent font-polin-medium text-sm hover:underline transition-all"
            >
              {isSignUp ? "התחברות" : "הרשמה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
