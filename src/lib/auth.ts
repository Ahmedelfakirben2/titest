
import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
// Import Adapter type if you plan to use an adapter later
// import type { Adapter } from 'next-auth/adapters';
// Example for Firestore Adapter (uncomment if needed and ensure firebase is configured)
// import { FirestoreAdapter } from "@auth/firebase-adapter";
// import { firestore } from '@/lib/firebase';

// Define the necessary scopes for Microsoft Graph API
// User.Read: Required to sign in and read the user's profile.
// DeviceManagementManagedDevices.Read.All: Required to read Intune device information.
// offline_access: Required to get a refresh token (useful for long-lived sessions or backend access).
const SCOPES = [
  'openid', // Required by OpenID Connect
  'profile', // Standard OIDC scope
  'email', // Standard OIDC scope
  'User.Read',
  'DeviceManagementManagedDevices.Read.All',
  'offline_access',
];

// Validate essential environment variables
if (!process.env.AUTH_SECRET) {
  // It's often better to throw an error during build/startup for critical missing variables
  throw new Error('CRITICAL: Missing AUTH_SECRET environment variable');
} else if (process.env.AUTH_SECRET.length < 32) {
  console.warn(`
    -------------------------------------------------------------------
    WARNING: AUTH_SECRET is set but appears short (less than 32 characters).
    For security, it's strongly recommended to use a longer, randomly generated secret.
    You can generate one using: openssl rand -base64 32
    -------------------------------------------------------------------
  `);
}

if (!process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID) {
  throw new Error('CRITICAL: Missing AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID environment variable');
}
if (!process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET) {
  throw new Error('CRITICAL: Missing AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET environment variable');
}
if (!process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID) {
  throw new Error('CRITICAL: Missing AUTH_MICROSOFT_ENTRA_ID_TENANT_ID environment variable');
}

// Explicitly set AUTH_URL using NEXT_PUBLIC_AUTH_URL for client-side availability if needed,
// but primarily use AUTH_URL for server-side configuration.
const authUrl = process.env.AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL;

if (!authUrl) {
    // Log a warning but allow startup for simpler local dev setups where NextAuth might infer localhost
    console.warn(`
      -------------------------------------------------------------------
      WARNING: The AUTH_URL environment variable is not set.
      NextAuth.js requires AUTH_URL to function reliably, especially for OAuth redirects.
      Defaulting might work for some scenarios (like http://localhost:9002), but it's
      highly recommended to set it explicitly in your .env file for clarity and production.
      Example: AUTH_URL=http://localhost:9002 (local dev)
               AUTH_URL=https://your-app-domain.com (production)
      Ensure this URL matches the Redirect URI configured in your Azure AD App Registration.
      -------------------------------------------------------------------
    `);
    // If you want to enforce it, throw an error here instead:
    // throw new Error('CRITICAL: Missing AUTH_URL environment variable');
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use the AUTH_URL from environment variables. Crucial for OAuth redirects.
  // If not set, NextAuth attempts to infer, which can be unreliable.
  ...(authUrl && { url: new URL(authUrl) }),

  // Set the base path if your auth routes are different from the default /api/auth
  // basePath: '/api/auth', // Default, usually not needed unless customized

  // Trust the host header only if provided by a trusted proxy (e.g., Vercel, Cloud Run)
  // Set to true if your deployment environment sets X-Forwarded-Host correctly.
  // Using AUTH_URL explicitly (as done above) is generally safer and preferred.
  // trustHost: process.env.NODE_ENV !== 'development', // Example: trust in production
  trustHost: true, // Simpler approach, relies on proxy correctly setting headers or explicit AUTH_URL

  secret: process.env.AUTH_SECRET, // Use the strong secret from environment variables

  // Optional: Add adapter here if you need to persist users/sessions to a database
  // adapter: FirestoreAdapter(firestore), // Example using Firestore

  providers: [
    MicrosoftEntraID({
      // Client ID and Secret from Azure AD App Registration
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      // Tenant ID for your Azure AD directory
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
      // Request specific permissions (scopes) for Microsoft Graph API
      authorization: {
        params: {
          scope: SCOPES.join(' '),
          // Optional: prompt=consent forces user consent screen on first login or if scopes change
          // prompt: "consent",
        },
      },
      // IMPORTANT: Ensure the Redirect URI in your Azure AD App Registration
      // exactly matches the callback URL NextAuth uses.
      // Example with AUTH_URL=http://localhost:9002:
      // http://localhost:9002/api/auth/callback/microsoft-entra-id
      // Example with AUTH_URL=https://your-app.com:
      // https://your-app.com/api/auth/callback/microsoft-entra-id
      // Check NextAuth logs or network requests if you encounter redirect URI mismatch errors.

      // Optional: Customize the profile data mapped to the NextAuth user object
      // profile(profile, tokens) {
      //   console.log("Microsoft Entra ID Profile:", profile);
      //   console.log("Microsoft Entra ID Tokens:", tokens); // Contains access_token, id_token etc.
      //   return {
      //     id: profile.sub || profile.oid, // Use 'sub' (subject) or 'oid' (object ID) as unique ID
      //     name: profile.name,
      //     email: profile.email || profile.preferred_username, // Use email or UPN
      //     image: null, // You could potentially map a profile picture URL if available in profile data
      //     userPrincipalName: profile.preferred_username, // Store UPN if needed
      //     // Add any other custom fields you need from the profile
      //   };
      // }
    }),
    // Add other providers here if needed (e.g., Google, GitHub)
  ],
  callbacks: {
    // The jwt callback is invoked when a JWT is created (on sign-in)
    // or updated (when session accessed client-side, or token needs refresh).
    async jwt({ token, user, account, profile, isNewUser }) {
       // console.log("JWT Callback Triggered:", { token, user, account, profile, isNewUser });

      // Initial sign-in: Persist essential info from account and profile to the JWT
      if (account && profile) {
        // console.log("JWT Callback - Initial Sign-in or Token Refresh");
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Crucial for refreshing access token
        // account.expires_at is in seconds since epoch. Convert to milliseconds.
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined;
        // Use 'oid' (Object ID) if available, otherwise 'sub' (Subject) as the primary user identifier
        token.userId = profile?.oid || profile?.sub;
        // Store User Principal Name (often used for Graph API calls)
        token.userPrincipalName = profile?.preferred_username || profile?.email; // Fallback to email if UPN missing
        token.error = undefined; // Clear any previous errors on successful sign-in/refresh

        // You can also add roles or other claims from the profile/id_token if needed
        // token.roles = profile?.roles; // Example if roles are in the profile
         // console.log("JWT after initial population:", token);
      }

       // Check if the current access token is still valid
       // Add a buffer (e.g., 60 seconds) to attempt refresh *before* it actually expires
       const bufferTime = 60 * 1000; // 60 seconds
       const isTokenValid = token.expiresAt && (Date.now() < (token.expiresAt - bufferTime));

       if (isTokenValid) {
           // console.log("JWT Callback - Token is still valid.");
           return token; // Return the existing token without modification
       }

       // Access token has expired (or is close to expiring) or needs refresh.
       // console.log("JWT Callback - Token expired or needs refresh.");

       // Check if we have a refresh token to attempt refresh
       if (!token.refreshToken) {
           console.error("JWT Callback - Access token expired, but no refresh token available.");
           token.error = "MissingRefreshToken";
           // Optionally clear expired access token
           delete token.accessToken;
           return token; // Cannot refresh, return token with error
       }

       // --- Attempt Token Refresh ---
       try {
           // console.log("JWT Callback - Attempting token refresh...");
           const response = await fetch(`https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/oauth2/v2.0/token`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
               body: new URLSearchParams({
                   client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID!,
                   client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET!,
                   grant_type: 'refresh_token',
                   refresh_token: token.refreshToken,
                   scope: SCOPES.join(' '), // Request the same scopes again
               }),
           });

           const refreshedTokens = await response.json();

           if (!response.ok) {
               console.error("JWT Callback - Token refresh failed:", refreshedTokens);
               // More specific error handling based on 'refreshedTokens.error' if needed
                token.error = refreshedTokens.error || "RefreshTokenError"; // e.g., 'invalid_grant'
                // Clear potentially invalid tokens
                delete token.accessToken;
                delete token.refreshToken; // If refresh fails, the refresh token might also be invalid
                delete token.expiresAt;
               throw new Error(`Token refresh failed with status ${response.status}`);
           }

           // console.log("JWT Callback - Token refresh successful.");

           // Update the token with the new values from the refresh response
           token.accessToken = refreshedTokens.access_token;
           // Microsoft might return a new refresh token (optional, handle if provided)
           token.refreshToken = refreshedTokens.refresh_token ?? token.refreshToken;
           // expires_in is in seconds, calculate new expiry time in milliseconds
           token.expiresAt = Date.now() + (refreshedTokens.expires_in * 1000);
           token.error = undefined; // Clear error on successful refresh

            // console.log("JWT after successful refresh:", token);
           return token;

       } catch (error) {
           console.error("JWT Callback - Error during token refresh:", error);
           // Error is already set in the 'if (!response.ok)' block if it was an API error
           // If the fetch itself failed, set a generic error
            if (!token.error) {
                token.error = "RefreshTokenFetchError";
            }
            // Consider clearing tokens here as well, depending on recovery strategy
            delete token.accessToken;
            // delete token.refreshToken; // Decide if refresh token should be kept after fetch error
            delete token.expiresAt;
           return token; // Return token with the error state
       }
    },

    // The session callback is called client-side to populate the session object.
    // Data from the JWT token (managed by the jwt callback) is passed here.
    async session({ session, token }) {
      // Pass essential details from the JWT to the client-side session object
      session.accessToken = token.accessToken as string | undefined; // May be undefined if expired/refresh failed
      session.userId = token.userId as string | undefined;
      session.userPrincipalName = token.userPrincipalName as string | undefined;
      session.error = token.error as string | undefined; // Propagate errors (e.g., "RefreshTokenError")

      // Ensure the user object in the session has the correct ID and other details
      if (session.user) {
        session.user.id = token.userId as string | undefined ?? null; // Use the ID from JWT
         // Ensure email and name from token are reflected if available
         session.user.email = token.email ?? session.user.email;
         session.user.name = token.name ?? session.user.name;
      }

       // console.log("Session Callback Executed:", { session, token });
      return session; // Return the modified session object
    },
  },

  // Configure custom pages for authentication flow
   pages: {
     // Redirect users to the homepage ('/') to initiate sign-in if they try to access protected content
     // or if they explicitly navigate to a default sign-in page that doesn't exist.
     signIn: '/',
     // Redirect to a custom error page on authentication errors
     error: '/auth/error', // Ensure this page exists at src/app/auth/error/page.tsx
     // signOut: '/', // Optional: Where to redirect after sign out (defaults to signIn page)
     // verifyRequest: '/auth/verify-request', // Optional: Page for email verification prompts
     // newUser: '/auth/new-user' // Optional: Redirect new users to a specific page
   },

  // Optional: Enable debug logs in development for more detailed output
  // debug: process.env.NODE_ENV === 'development',

  // Session configuration (using JWT strategy by default)
  session: {
     strategy: 'jwt', // Explicitly state JWT strategy (default)
     // maxAge: 30 * 24 * 60 * 60, // Optional: Session max age in seconds (default: 30 days)
     // updateAge: 24 * 60 * 60, // Optional: How often to revalidate session (default: 24 hours)
  },

   // Event listeners (optional) - useful for logging or side effects
   events: {
     async signIn({ user, account, profile, isNewUser }) {
       // console.log(`Sign In Event: User ${user.id} (${user.email}), Account: ${account?.provider}, New User: ${isNewUser}`);
     },
     async signOut({ session, token }) {
       // console.log(`Sign Out Event: User ${token.userId} (${token.email})`);
     },
     // async createUser({ user }) { console.log("Create User Event:", user); },
     // async updateUser({ user }) { console.log("Update User Event:", user); },
     // async linkAccount({ user, account, profile }) { console.log("Link Account Event:", user, account); },
     // async session({ session, token }) { console.log("Session Event:", session); }, // Be careful logging sensitive session data
   }
});
// Removed trailing curly brace that caused the EOF error
// }
    