
'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export function SignInButton() {
  return (
    <Button
      variant="outline"
      onClick={() => signIn('microsoft-entra-id', { callbackUrl: '/' })}
      className="flex items-center gap-2"
    >
      <LogIn className="h-4 w-4" />
      Sign in with Microsoft
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
