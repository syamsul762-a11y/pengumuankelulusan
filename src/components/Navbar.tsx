import React, { useState, useEffect } from 'react';
import { GraduationCap, LogIn, LayoutDashboard, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "syamsul762@guru.sd.belajar.id") {
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <span className="font-heading text-lg font-bold leading-none tracking-tight">SIKS</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Pengumuman Kelulusan</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant={location.pathname === '/' ? 'secondary' : 'ghost'} size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Beranda</span>
            </Button>
          </Link>
          <Link to="/cek">
            <Button variant={location.pathname === '/cek' ? 'secondary' : 'ghost'} size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Cek Kelulusan</span>
            </Button>
          </Link>
          
          {user ? (
            <Link to="/admin/dashboard">
              <Button variant="default" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

