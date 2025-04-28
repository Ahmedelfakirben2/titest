
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
    }),
  ],
  callbacks: {
    // The jwt callback is called when a JWT is created (i.e., on sign in)
    // or updated (i.e., whenever a session is accessed in the client).
    async jwt({ token, account, profile }) {
      // Persist the access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Store the refresh token
        token.expiresAt = account.expires_at; // Store the expiry time
        // Add user's object id (oid) or subject (sub) from the profile for Graph API calls
        token.userId = profile?.oid || profile?.sub;
        token.userPrincipalName = profile?.preferred_username || profile?.email; // Often needed for Graph filters
      }

      // TODO: Implement token refresh logic if needed, especially for backend usage.
      // The current setup primarily focuses on client-side access during the session.
      // Refresh logic is complex and depends on how/where the token is used long-term.

      return token;
    },
    // The session callback is called whenever a session is checked.
    // We pass the access token and user ID to the session object here.
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.userId = token.userId as string;
      session.userPrincipalName = token.userPrincipalName as string;
      session.error = token.error as string | undefined; // Pass potential errors
      return session;
    },
  },
  // Add custom pages if needed
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error', // Error code passed in query string as ?error=
  // },
});
