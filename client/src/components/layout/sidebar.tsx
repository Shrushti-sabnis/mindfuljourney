import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "@/components/user/user-profile-dialog";
import { 
  Home, 
  BookOpenText, 
  SmilePlus, 
  Waves, 
  LogOut, 
  Settings,
} from "lucide-react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { path: "/journal", label: "Journal", icon: <BookOpenText className="h-5 w-5 mr-3" /> },
    { path: "/mood", label: "Mood Tracker", icon: <SmilePlus className="h-5 w-5 mr-3" /> },
    { path: "/mindfulness", label: "Mindfulness", icon: <Waves className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-2xl font-bold text-primary font-heading">MIND</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center p-2 text-neutral-600 rounded-lg hover:bg-neutral-100",
                    location === item.path && "bg-neutral-100 text-neutral-700"
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="bg-neutral-100 rounded-lg p-4">
            <h3 className="font-medium text-neutral-800 mb-2">
              {user?.isPremium ? "Premium Member" : "Upgrade to Premium"}
            </h3>
            <p className="text-sm text-neutral-600 mb-3">
              {user?.isPremium 
                ? "Enjoy advanced analytics and deep reflection prompts." 
                : "Unlock deep reflection prompts and advanced analytics."}
            </p>
            {!user?.isPremium && (
              <Link href="/subscribe">
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                  Upgrade Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="font-medium">
              {user?.username?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="font-medium text-neutral-800">{user?.username}</p>
            <p className="text-sm text-neutral-500">
              {user?.isPremium ? "Premium Plan" : "Free Plan"}
            </p>
          </div>
          
          <div className="ml-auto flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProfileDialogOpen(true)}
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
      
      {/* Profile Dialog */}
      <UserProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </div>
  );
}
