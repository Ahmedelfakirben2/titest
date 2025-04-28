
import 'next-auth';
import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    userId?: string;
    userPrincipalName?: string;
    error?: string; // Optional field to propagate auth errors
    user: {
      /** The user's id (typically OID or sub from Entra ID). */
      id?: string | null;
     } & DefaultSession['user'];
  }

   /** Extends the default User type if needed */
  interface User extends DefaultUser {
    // Add custom properties from the provider profile if needed
    // e.g., oid?: string;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** Microsoft Graph API access token */
    accessToken?: string;
    /** Microsoft Graph API refresh token */
    refreshToken?: string;
    /** Access token expiry time (in seconds since epoch) */
    expiresAt?: number;
    /** OID (Object ID) or SUB (Subject) from Entra ID profile */
    userId?: string;
    /** User Principal Name (email) */
    userPrincipalName?: string;
    /** Field to track token refresh errors */
    error?: string;
  }
}
