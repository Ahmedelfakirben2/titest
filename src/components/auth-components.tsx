
'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export function SignInButton() {
  const { toast } = useToast(); // Get toast function

  const handleSignIn = () => {
    console.log("Attempting to sign in with Microsoft Entra ID...");
    // The signIn function initiates the flow, redirecting the user.
    // A 'Failed to fetch' error here usually indicates the browser couldn't reach
    // the /api/auth/signin/microsoft-entra-id endpoint or the subsequent Microsoft endpoint.
    // Check browser console Network tab for details (CORS, 404s, redirect mismatches).
    // Ensure AUTH_URL is correctly set in .env and matches Azure AD redirect URI.
    signIn('microsoft-entra-id', {
      // Redirect back to the root page after successful sign-in
      callbackUrl: '/',
      // Optional: Redirect immediately without showing intermediate NextAuth page
      // redirect: true (default is true)
    })
      .catch(error => {
        // This catch block might not capture redirect-related fetch errors effectively
        // (as the browser navigates away), but can catch other issues with the signIn promise itself
        // or if the user closes the popup prematurely.
        console.error("Client-side error during signIn initiation:", error);

        // Determine the likely cause based on the environment
        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'NOT_SET';
        let userMessage = `Sign-in initiation failed. Check the browser's developer console (Network tab) for details. Possible causes: network issues, CORS problems, incorrect configuration, or popup blocker.`;

        if (error.message && error.message.includes('Failed to fetch')) {
           userMessage = `Error connecting to the authentication service ('Failed to fetch'). \
Please check your internet connection and ensure you can reach the application URL. \
Verify the configured application URL (NEXT_PUBLIC_AUTH_URL): ${authUrl}. \
Also check your browser's network log for specific errors (like CORS or 404).`;
        } else if (error.message) {
            userMessage = `Sign-in initiation failed: ${error.message}. Check console for details.`
        }

        // Use toast for a less intrusive error message
        toast({
          title: "Sign-in Error",
          description: userMessage,
          variant: "destructive",
        });
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
      onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after sign out
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
