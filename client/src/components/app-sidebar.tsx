import { BarChart3, FileUp, Home, TrendingUp, AlertTriangle, Target, Zap, Search ,LogOut, User } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Upload Documents",
    url: "/upload",
    icon: FileUp,
  },
  {
    title: "Analysis Results",
    url: "/analysis",
    icon: BarChart3,
  },
  {
    title: "Benchmarks",
    url: "/benchmarks",
    icon: Target,
  },
  {
    title: "Research Test",
    url: "/research-test",
    icon: Search,
  },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { user, signOut } = useAuth()

  // Function to check if a menu item should be active
  const isMenuItemActive = (itemUrl: string) => {
    // Exact match for dashboard (root path)
    if (itemUrl === "/" && currentPath === "/") {
      return true
    }
    
    // For other paths, check if current path starts with the item URL
    // but exclude dashboard from matching nested paths
    if (itemUrl !== "/" && currentPath.startsWith(itemUrl)) {
      return true
    }
    
    return false
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/signin")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  return (
    <Sidebar data-testid="sidebar-main" className="sidebar-modern">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
          data-testid="logo-home-link"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
            <img src="/startupsherlock.png" alt="Startup Sherlock" className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">
              Startup Sherlock
            </h2>
            <p className="text-xs text-muted-foreground font-medium">Investment Intelligence</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isMenuItemActive(item.url)}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`nav-item ${isMenuItemActive(item.url) ? 'active' : ''}`}
                    onClick={() => navigate(item.url)}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent/30 transition-colors">
                        <item.icon className="h-4 w-4 text-sidebar-foreground" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-6 hover:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {user?.displayName || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              Profile (Coming soon)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}