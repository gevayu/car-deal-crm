import { Car, BarChart3, Users, LogOut, ChevronLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
            <div className="flex items-center gap-2.5 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <Car className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sidebar-foreground font-polin-medium text-sm leading-tight">מערכת ניהול</p>
                <p className="text-sidebar-foreground/50 font-polin-light text-xs">רכבים</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center mx-auto">
              <Car className="h-4 w-4 text-primary" />
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
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground font-polin-light text-xs truncate">{user?.email}</p>
              <Badge className="mt-1 bg-sidebar-primary text-sidebar-primary-foreground font-polin-medium border-0 text-xs h-5">
                {isAdmin ? "מנהל" : "איש מכירות"}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full h-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
