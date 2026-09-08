"use client";

import { useEffect, type ReactNode } from "react";
import { FadeIn } from "@/components/atoms/FadeIn";
import { PortalSkeleton } from "@/components/features/portal/PortalSkeleton";
import { useAuth } from "@/lib/auth";
import { PORTAL_PATHS } from "@/lib/sites";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  /** When true, show skeleton while session is loading or already signed in. */
  sessionPending?: boolean;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  sessionPending,
}: AuthShellProps) {
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "signedIn") {
      window.location.assign(PORTAL_PATHS.orgs);
    }
  }, [auth.status]);

  if (!auth.configured) {
    return (
      <p className="border-outline-variant/20 bg-surface-container-low text-on-surface-variant border p-6">
        Portal auth is not configured. Set `NEXT_PUBLIC_API_URL`,
        `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, and `NEXT_PUBLIC_COGNITO_CLIENT_ID`
        then rebuild.
      </p>
    );
  }

  const pending =
    sessionPending ??
    (auth.status === "loading" || auth.status === "signedIn");

  return (
    <div>
      <FadeIn>
        <p className="font-label text-outline mb-6 text-xs tracking-[0.4em] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-headline max-w-3xl text-4xl font-bold tracking-tighter text-white md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="text-on-surface-variant mt-6 max-w-xl text-lg">
            {description}
          </p>
        ) : null}
      </FadeIn>

      {pending ? (
        <div className="mt-14">
          <PortalSkeleton variant="login" />
        </div>
      ) : (
        <FadeIn className="mx-auto mt-14 max-w-xl space-y-10" y={12}>
          {children}
        </FadeIn>
      )}
    </div>
  );
}
