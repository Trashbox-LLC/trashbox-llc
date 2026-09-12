"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Button } from "@/components/ui/button";
import { settingsSectionPath } from "@/lib/portal-settings";

export interface SmsTextingOfferProps {
  availableOnPlan: boolean;
  canManage: boolean;
  onStart?: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="font-headline text-xl font-bold text-white">{title}</h3>
      <p className="text-on-surface-variant mt-3 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export function SmsTextingOffer({
  availableOnPlan,
  canManage,
  onStart,
}: SmsTextingOfferProps) {
  return (
    <div className="space-y-12">
      <div className="space-y-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="font-label text-outline text-[10px] tracking-widest uppercase">
            Texting
          </p>
          {!availableOnPlan && (
            <span className="font-label text-outline inline-flex items-center gap-1 text-[10px] tracking-widest uppercase">
              <MaterialIcon name="lock" className="text-sm" />
              Locked
            </span>
          )}
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-white md:text-5xl">
          A number for this project
        </h2>
      </div>

      <div className="border-outline-variant/10 bg-surface-container relative aspect-video w-full overflow-hidden border">
        <Image
          src="/images/sms-texting-ui.png"
          alt="Lead conversation with texts"
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
      </div>

      <div className="grid gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-12">
        <Section title="How it works">
          You apply with your business name, website, and how customers agree to
          be texted. We read it first so a messy application never reaches the
          phone networks.
        </Section>

        <Section title="The plan">
          $10 a month for the number, plus extra when you send more than the
          included texts. Billing starts only after the networks approve — nothing
          if they turn it down.
        </Section>

        <Section title="Approval">
          Phone companies have to verify every business number. That usually
          takes a few days. You can fix and resubmit once if they ask for
          changes.
        </Section>

        <Section title="Once you are live">
          {availableOnPlan
            ? "Texts sit in the same lead thread as email. Turn it off anytime and the monthly charge stops."
            : "Texting is on Solo and Team. After that, the same approval and monthly plan apply."}
        </Section>
      </div>

      <div className="flex justify-center">
        {availableOnPlan && canManage && onStart ? (
          <Button type="button" onClick={onStart}>
            Get a number
          </Button>
        ) : null}
        {!availableOnPlan ? (
          <Button asChild type="button">
            <a href={settingsSectionPath("current-plan", "org")}>
              Compare plans
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
