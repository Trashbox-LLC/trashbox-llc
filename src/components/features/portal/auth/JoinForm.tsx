"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/features/portal/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import {
  emailFromSearchString,
  isUsernameExistsError,
  pendingConfirmPath,
  portalLoginPath,
  setPendingSignupPassword,
} from "@/lib/portal-auth";

function redirect(path: string) {
  window.location.assign(path);
}

export function JoinForm() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromQuery = emailFromSearchString(window.location.search);
    if (fromQuery) setEmail(fromQuery);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const next = await auth.signUpWithPassword(email, password);
      if (next === "confirm") {
        setPendingSignupPassword(email, password);
        redirect(pendingConfirmPath(email));
      }
    } catch (err) {
      if (isUsernameExistsError(err)) {
        try {
          await auth.signInWithPassword(email, password);
          return;
        } catch {
          redirect(portalLoginPath(email));
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Could not continue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Portal" title="Continue.">
      <form className="space-y-8" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="portal-join-email">Email</Label>
          <Input
            id="portal-join-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <Label htmlFor="portal-join-password">Password</Label>
          <Input
            id="portal-join-password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <Label htmlFor="portal-join-confirm">Confirm password</Label>
          <Input
            id="portal-join-confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Working…" : "Continue"}
        </Button>
      </form>

      <p className="text-on-surface-variant text-sm">
        <Link href={portalLoginPath(email)} className="text-white underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
