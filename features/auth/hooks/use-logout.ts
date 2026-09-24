"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logoutUser } from "@/features/auth/services/logout-user";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";

export function useLogout() {
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);

    try {
      // Best-effort server logout; never block the local sign-out on a 5xx/network error.
      const response = await logoutUser().catch(() => null);

      clearUser();

      // Clear in-progress drafts (they hold ID numbers, IBANs and deed images)
      // so they never leak to the next person on a shared device.
      try {
        [
          "aqdi-create-contract-draft",
          "aqdi-create-property-draft",
          "aqdi-create-unit-draft",
          "aqdi-auth-user",
        ].forEach((key) => localStorage.removeItem(key));
      } catch {
        // localStorage may be unavailable (private mode) — ignore.
      }

      router.push("/login");

      return {
        ok: true as const,
        message: response?.message,
      };
    } finally {
      setIsLoading(false);
    }
  }

  return {
    logout,
    isLoading,
  };
}
