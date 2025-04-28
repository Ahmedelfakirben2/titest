
'use client';

import type { Session } from 'next-auth';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
  session: Session | null; // Pass session data obtained server-side
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  // The session prop is required for Server Components using useSession
  // In Client Components, SessionProvider manages the session state automatically
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
