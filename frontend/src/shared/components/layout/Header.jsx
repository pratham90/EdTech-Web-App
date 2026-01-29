import React from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Brain, 
  LogOut, 
  Settings, 
  User, 
  Bell,
  Search
} from 'lucide-react';
import { Input } from '../ui/input';

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b border-white/20 glass-effect shadow-soft sticky top-0 z-50">
      <div className="flex h-18 items-center px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-xl animate-glow opacity-75"></div>
            <div className="relative p-3 bg-gradient-primary rounded-xl">
              <Brain className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EduTech Platform
            </h1>
            <Badge variant="secondary" className="text-xs mt-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
              {user.role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
            </Badge>
          </div>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={user.role === 'teacher' ? 'Search topics, papers...' : 'Search topics, practice...'}
              className="pl-12 bg-white/50 backdrop-blur border-white/30 rounded-xl shadow-soft focus:shadow-soft-lg transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative p-3 hover:bg-white/20 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-soft group">
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs flex items-center justify-center animate-pulse">
              3
            </span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  <Avatar className="h-11 w-11 border-2 border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-200">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="w-fit mt-1">{user.role}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
