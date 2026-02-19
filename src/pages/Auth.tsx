import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import logoImg from "@/assets/logo.png";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setGoogleLoading(false);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "נשלח!", description: "בדוק את תיבת המייל שלך לקישור לאיפוס הסיסמה." });
      setIsForgotPassword(false);
    }
  };

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
      navigate("/email-confirmation");
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
            <img src={logoImg} alt="לוגו" className="h-24 w-auto object-contain" />
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
          {/* Logo above form */}
          <div className="flex items-center justify-center mb-8">
            <img src={logoImg} alt="לוגו" className="h-24 w-auto object-contain dark:invert-0 invert" />
          </div>

          {isForgotPassword ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-polin-medium text-foreground mb-2">שכחת סיסמה?</h2>
                <p className="text-muted-foreground font-polin-light">
                  הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
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

                <Button
                  type="submit"
                  className="w-full h-11 font-polin-medium text-base bg-primary hover:bg-primary/90 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "שולח..." : "שלח קישור לאיפוס"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="text-accent font-polin-medium text-sm hover:underline transition-all"
                >
                  חזרה להתחברות
                </button>
              </div>
            </>
          ) : (
            <>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-polin-medium text-foreground">סיסמה</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-accent font-polin-light text-xs hover:underline transition-all"
                      >
                        שכחת סיסמה?
                      </button>
                    )}
                  </div>
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

              <div className="flex items-center gap-3 my-5">
                <Separator className="flex-1" />
                <span className="text-muted-foreground font-polin-light text-xs">או</span>
                <Separator className="flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-polin-medium text-sm gap-3"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "מתחבר..." : "התחברות עם Google"}
              </Button>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
