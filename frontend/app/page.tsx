'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to ProSets</h1>

        {user ? (
          <div className="flex flex-col gap-4 items-center">
            <img src={user.picture || ''} alt={user.name || 'User'} className="rounded-full w-20 h-20" />
            <h2 className="text-2xl">Hello, {user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <a
              href="/api/auth/logout"
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            >
              Logout
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <p>You are not logged in.</p>
            <a
              href="/api/auth/login"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            >
              Login
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
