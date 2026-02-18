import { Car, BarChart3, Users, LogOut, ChevronLeft, UserCircle } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { isAdmin, signOut, user } = useAuth();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const navItems = [
    { title: "מלאי רכבים", url: "/", icon: Car, end: true },
    { title: "דשבורד", url: "/dashboard", icon: BarChart3, end: false },
    ...(isAdmin ? [{ title: "ניהול משתמשים", url: "/users", icon: Users, end: false }] : []),
  ];

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="border-l border-sidebar-border"
    >
      {/* Logo / Header */}
      <SidebarHeader className="bg-sidebar px-3 py-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
              <img src={logoImg} alt="לוגו" className="h-24 w-auto object-contain" />
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center mx-auto">
              <img src={logoImg} alt="לוגו" className="h-10 w-auto object-contain" />
            </div>
          )}
          <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent ml-auto">
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="bg-sidebar px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/70 font-polin-light transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-polin-medium border-r-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: user info + logout */}
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border px-3 py-3">
        {!collapsed ? (
          <div className="space-y-2">
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent transition-colors text-right"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground font-polin-light text-xs truncate">{user?.email}</p>
                <Badge className="mt-0.5 bg-sidebar-primary text-sidebar-primary-foreground font-polin-medium border-0 text-xs h-5">
                  {isAdmin ? "מנהל" : "איש מכירות"}
                </Badge>
              </div>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent font-polin-light text-xs gap-2 justify-start"
            >
              <LogOut className="h-3.5 w-3.5" />
              יציאה
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full h-8"
            >
              <UserCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full h-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
