"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export function AuthButton() {
  const isLoggedIn = false; // Placeholder for auth state

  // The login feature is removed, so we render nothing.
  if (true) return null;

  return isLoggedIn ? (
    <div>{/* User Profile Dropdown */}</div>
  ) : (
    <Button asChild>
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </Link>
    </Button>
  );
}
