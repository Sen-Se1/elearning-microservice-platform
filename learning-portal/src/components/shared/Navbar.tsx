'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  BrainCircuit, 
  Search, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  Menu,
  Sparkles
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold font-outfit tracking-tight">Aura<span className="text-indigo-500">Learn</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className={cn("transition-colors", pathname === '/' ? "text-indigo-400" : "hover:text-indigo-400")}>Home</Link>
          <Link href="/courses" className={cn("transition-colors", pathname.startsWith('/courses') ? "text-indigo-400" : "hover:text-indigo-400")}>Courses</Link>
          {user && (
            <>
              {user.role === 'instructor' ? (
                <Link href="/instructor" className={cn("transition-colors", pathname.startsWith('/instructor') ? "text-indigo-400" : "hover:text-indigo-400")}>
                  Instructor Studio
                </Link>
              ) : (
                <>
                  <Link href="/dashboard" className={cn("transition-colors", pathname.startsWith('/dashboard') ? "text-indigo-400" : "hover:text-indigo-400")}>
                    My Learning
                  </Link>
                  <Link href="/ai-tutor" className={cn("transition-colors font-medium flex items-center gap-1.5", pathname.startsWith('/ai-tutor') ? "text-indigo-400" : "hover:text-indigo-400")}>
                    <Sparkles className="w-4 h-4" /> AI Tutor
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="w-5 h-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full cursor-pointer overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                  <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem className="p-0">
                  <Link href={user.role === 'instructor' ? '/instructor' : '/dashboard'} className="flex items-center w-full px-2 py-1.5 cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {user.role !== 'instructor' && (
                  <DropdownMenuItem className="p-0">
                    <Link href="/ai-tutor" className="flex items-center w-full px-2 py-1.5 cursor-pointer text-indigo-400">
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Tutor
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="p-0">
                  <Link href="/profile" className="flex items-center w-full px-2 py-1.5 cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
                Sign In
              </Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "default" }), "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20")}>
                Get Started
              </Link>
            </div>
          )}
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
