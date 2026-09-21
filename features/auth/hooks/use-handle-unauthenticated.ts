"use client";

import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";

export function useHandleUnauthenticated() {
  const router = useRouter();
  const pathname = usePathname();
  const clearUser = useAuthStore((state) => state.clearUser);

  return function handleUnauthenticated() {
    clearUser();
    // Preserve the current query string (e.g. ?id=residential) so the user
    // returns to the exact same flow after logging in, instead of silently
    // defaulting to the commercial contract.
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const target = `${pathname}${search}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
  };
}
