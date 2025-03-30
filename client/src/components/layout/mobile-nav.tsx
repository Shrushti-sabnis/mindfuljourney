import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { UserProfileDialog } from "@/components/user/user-profile-dialog";
import { 
  Home, 
  BookOpenText, 
  SmilePlus, 
  Waves, 
  Menu,
  LogOut,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { path: "/journal", label: "Journal", icon: <BookOpenText className="h-5 w-5" /> },
    { path: "/mood", label: "Mood Tracker", icon: <SmilePlus className="h-5 w-5" /> },
    { path: "/mindfulness", label: "Mindfulness", icon: <Waves className="h-5 w-5" /> },
  ];

  return (
    <div className="lg:hidden bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary font-heading">MIND</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
        
        {menuOpen && (
          <div className="mt-4">
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <a
                        className={cn(
                          "block p-2 text-neutral-600 rounded-lg hover:bg-neutral-100",
                          location === item.path && "bg-neutral-100 text-neutral-700"
                        )}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    </Link>
                  </li>
                ))}
                {!user?.isPremium && (
                  <li>
                    <Link href="/subscribe">
                      <a
                        className="block p-2 text-accent font-medium rounded-lg hover:bg-neutral-100"
                        onClick={() => setMenuOpen(false)}
                      >
                        Upgrade to Premium
                      </a>
                    </Link>
                  </li>
                )}
              </ul>
              
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="font-medium text-sm">
                        {user?.username?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-2">
                      <p className="font-medium text-neutral-800">{user?.username}</p>
                      <p className="text-xs text-neutral-500">
                        {user?.isPremium ? "Premium Plan" : "Free Plan"}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setProfileDialogOpen(true);
                        setMenuOpen(false);
                      }}
                      title="Edit Profile"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
      
      {/* Profile Dialog */}
      <UserProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </div>
  );
}

export function MobileNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: <Home className="h-6 w-6" /> },
    { path: "/journal", label: "Journal", icon: <BookOpenText className="h-6 w-6" /> },
    { path: "/mood", label: "Mood", icon: <SmilePlus className="h-6 w-6" /> },
    { path: "/mindfulness", label: "Mindful", icon: <Waves className="h-6 w-6" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center p-2",
              location === item.path ? "text-primary" : "text-neutral-600"
            )}>
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
