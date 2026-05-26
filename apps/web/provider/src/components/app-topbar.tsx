'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Moon, Search, Sun, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationCenter } from '@/components/notification-center';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarContent } from './app-sidebar';
import { useAuthStore } from '@/lib/auth-store';

const STORAGE_KEY = 'naqla-theme';

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null) ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(stored);
    document.documentElement.classList.toggle('dark', stored === 'dark');
    setMounted(true);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem(STORAGE_KEY, next);
  };
  return { theme, mounted, toggle };
}

export function AppTopbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, mounted, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'الناقل';
  const initials = fullName.split(' ').slice(0, 2).map((w) => w[0]).join('');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">القائمة</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-72 sm:max-w-72 flex flex-col">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 items-center gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="ابحث عن فرص، طلبات، شاحنات..." className="ps-9" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={toggle} aria-label="تبديل الثيم">
          {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <NotificationCenter audience="carrier" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 ps-2 ms-1 border-s rounded-md transition-colors hover:bg-accent/40 px-2 py-1">
              <Avatar>
                <AvatarFallback>{initials || 'ن'}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col leading-tight items-start">
                <span className="text-sm font-medium">{fullName}</span>
                <span className="text-xs text-muted-foreground">ناقل</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              الحساب الشخصي
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => { await logout(); router.push('/login'); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
