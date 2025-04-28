
'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export function SignInButton() {
  const handleSignIn = () => {
    console.log("Attempting to sign in with Microsoft Entra ID...");
    // The signIn function initiates the flow, redirecting the user.
    // A 'Failed to fetch' error here might indicate the browser couldn't reach
    // the /api/auth/signin/microsoft-entra-id endpoint or the subsequent Microsoft endpoint.
    // Check browser console Network tab for details (CORS, 404s, etc.)
    // Also ensure AUTH_URL is correctly set in .env
    signIn('microsoft-entra-id', { callbackUrl: '/' })
      .catch(error => {
        // This catch block might not capture redirect-related fetch errors effectively,
        // but can catch other potential issues with the signIn promise itself.
        console.error("Client-side error during signIn initiation:", error);
        // You could display a user-friendly message here using a state and Alert component
        // Example: Display an alert or use a toast notification
         alert(`Sign-in initiation failed: ${error.message || 'Unknown error'}. Check console for details. Ensure the AUTH_URL in .env matches your application's URL (${process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:9002'}).`);
      });
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignIn}
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
