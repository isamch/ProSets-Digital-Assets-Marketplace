'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
