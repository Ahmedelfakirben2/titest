
import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET, // Use the secret from environment variables
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
      // Request specific permissions (scopes) for Microsoft Graph API
      authorization: {
        params: {
          scope: SCOPES.join(' '),
        },
      },
      // Explicitly define the redirect URI based on AUTH_URL if needed,
      // though NextAuth usually handles this if AUTH_URL is set.
      // Consider adding this if issues persist:
      // profile(profile) {
      //   // You can customize the user object returned here
      //   return {
      //     id: profile.sub, // Or profile.oid
      //     name: profile.name,
      //     email: profile.email || profile.preferred_username,
      //     image: null, // Or map from profile picture if available/needed
      //     userPrincipalName: profile.preferred_username,
      //     oid: profile.oid
      //   };
      // }
    }),
  ],
  callbacks: {
    // The jwt callback is called when a JWT is created (i.e., on sign in)
    // or updated (i.e., whenever a session is accessed in the client).
    async jwt({ token, account, profile }) {
      // Persist the access_token and refresh_token to the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Store the refresh token
        token.expiresAt = account.expires_at; // Store the expiry time (in seconds since epoch)
        // Add user's object id (oid) or subject (sub) from the profile for Graph API calls
        token.userId = profile?.oid || profile?.sub;
        // Use preferred_username for UPN, fall back to email
        token.userPrincipalName = profile?.preferred_username || profile?.email;
        token.error = undefined; // Clear previous errors on successful sign-in/refresh
      } else if (Date.now() / 1000 < (token.expiresAt as number)) {
        // If the access token has not expired yet, return it
        return token;
      } else {
        // If the access token has expired, try to refresh it (optional, implement if needed)
        // This requires careful handling of the refresh token and API calls to the provider.
        // For now, we'll let it expire and potentially require re-login.
        console.log('Access token expired, refresh needed (refresh logic not implemented).');
        // You might want to set an error or clear the token here if refresh fails or isn't implemented
        // token.error = "RefreshTokenExpired"; // Example error state
      }


      return token;
    },
    // The session callback is called whenever a session is checked.
    // We pass the access token and user ID to the session object here.
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.userId = token.userId as string;
      session.userPrincipalName = token.userPrincipalName as string;
      session.error = token.error as string | undefined; // Pass potential errors

      // Add user id to the session user object
      if (token.userId && session.user) {
        session.user.id = token.userId;
      }
       // Ensure email is populated if available in the token
       if (token.email && session.user) {
        session.user.email = token.email;
       }
      // Ensure name is populated if available in the token
      if (token.name && session.user) {
          session.user.name = token.name;
      }


      return session;
    },
  },
  // Add custom pages if needed
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error', // Error code passed in query string as ?error=
  // },
});
