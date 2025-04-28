
'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export function SignInButton() {
  const { toast } = useToast(); // Get toast function

  const handleSignIn = () => {
    console.log("Attempting to sign in with Microsoft Entra ID...");

    // Retrieve AUTH_URL which should be available client-side if set via NEXT_PUBLIC_ prefix or proxied.
    // However, NextAuth primarily uses the server-side AUTH_URL for redirects.
    // We log it here mainly for debugging purposes.
    const configuredAuthUrl = process.env.NEXT_PUBLIC_AUTH_URL || "(AUTH_URL not exposed client-side)";
    console.log(`Expected Callback Base URL (from env): ${configuredAuthUrl}`);
    // Construct the expected full callback URL based on standard NextAuth path
    const expectedCallback = `${configuredAuthUrl}/api/auth/callback/microsoft-entra-id`;
    console.log(`Expected Full Callback URL for Azure AD Redirect URI: ${expectedCallback}`);
    console.log("Ensure this matches *exactly* what is configured in Azure AD App Registration -> Authentication -> Web Redirect URIs.");


    // The signIn function initiates the flow, redirecting the user.
    // A 'Failed to fetch' error here usually indicates the browser couldn't reach
    // the /api/auth/signin/microsoft-entra-id endpoint or the subsequent Microsoft endpoint.
    // Common causes:
    // 1. CORS Issues: Browser blocks the request. Check the Network tab for CORS errors. Ensure AUTH_URL is correct.
    // 2. Network Connectivity: Browser cannot reach the application server or Microsoft's login page.
    // 3. Incorrect AUTH_URL: The server-side AUTH_URL used by NextAuth for redirects is wrong.
    // 4. Misconfigured Redirect URI: The Redirect URI in Azure AD doesn't match the one NextAuth expects (see log above).
    // 5. Server-Side Error: The /api/auth/signin/[provider] route itself is failing (check server logs).
    // 6. Popup Blocker: Browser blocks the Microsoft login popup/redirect.
    signIn('microsoft-entra-id', {
      // Redirect back to the root page after successful sign-in
      callbackUrl: '/',
      // Optional: Redirect immediately without showing intermediate NextAuth page
      // redirect: true (default is true)
    }).catch(error => {
        // This catch block usually won't run for redirect errors because the browser navigates away.
        // It's more likely to catch issues if the signIn promise itself rejects *before* the redirect,
        // or if using popup mode and the popup fails.
        console.error("Client-side error during signIn initiation (rare for redirects):", error);

        // Determine the likely cause based on the environment and error type
        let userMessage = `Sign-in initiation failed. Please check the browser's developer console (Network tab) for specific errors (like 404, CORS, or redirect mismatches).`;

        if (error instanceof Error) {
            if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
               userMessage = `Error connecting to the authentication service ('Failed to fetch'). \
This often means the browser could not reach the sign-in endpoint or Microsoft's servers. \
Possible causes: \
1. Internet connection issue. \
2. Incorrect AUTH_URL configuration in your environment variables (server-side). \
3. Incorrect Redirect URI configured in Azure AD (must match: ${expectedCallback}). \
4. CORS issue (check browser console Network tab). \
5. Server-side problem with the '/api/auth/signin/microsoft-entra-id' route (check server logs).`;
            } else {
                userMessage = `Sign-in initiation failed: ${error.message}. Check the browser console and server logs for details.`;
            }
        }

        // Use toast for a less intrusive error message
        toast({
          title: "Sign-in Error",
          description: userMessage,
          variant: "destructive",
          duration: 9000, // Show longer for debugging
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
