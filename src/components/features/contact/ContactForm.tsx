"use client";

import { type FormEvent, useState } from "react";
import { FadeIn } from "@/components/atoms/FadeIn";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "@/lib/contact-form";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "@/lib/sites";

const labelClassName = "text-sm tracking-normal normal-case";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();
    const honeypot = String(data.get("_honeypot") || "");

    if (honeypot) {
      setStatus("sent");
      return;
    }

    if (!name || !email || !message) {
      setStatus("error");
      setErrorMessage("Please fill in name, email, and message.");
      return;
    }

    setStatus("sending");
    const result = await submitContactForm({
      name,
      email,
      message,
      metadata: phone ? { phone } : undefined,
    });

    if (result.success) {
      setStatus("sent");
      form.reset();
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  }

  return (
    <FadeIn>
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-10">
        <a
          href={CONTACT_PHONE_TEL}
          className="inline-flex items-center gap-2.5 text-base text-white/80 transition-colors hover:text-white"
        >
          <MaterialIcon name="call" className="text-[1.25rem]" />
          {CONTACT_PHONE_DISPLAY}
        </a>
        <a
          href={CONTACT_MAILTO}
          className="inline-flex items-center gap-2.5 text-base text-white/80 transition-colors hover:text-white"
        >
          <MaterialIcon name="mail" className="text-[1.25rem]" />
          {CONTACT_EMAIL}
        </a>
      </div>
      <form className="mx-auto max-w-4xl space-y-12" onSubmit={onSubmit}>
        <input
          type="text"
          name="_honeypot"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <Label htmlFor="contact-name" className={labelClassName}>
              Name
            </Label>
            <Input
              id="contact-name"
              name="name"
              placeholder="Jane Smith"
              type="text"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-email" className={labelClassName}>
              Email
            </Label>
            <Input
              id="contact-email"
              name="email"
              placeholder="jane@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="contact-phone" className={labelClassName}>
            Phone number
          </Label>
          <Input
            id="contact-phone"
            name="phone"
            placeholder="(555) 555-0100"
            type="tel"
            autoComplete="tel"
          />
        </div>
        <div>
          <Label htmlFor="contact-message" className={labelClassName}>
            Message details
          </Label>
          <Textarea
            id="contact-message"
            name="message"
            placeholder="How can we help?"
            rows={4}
            required
          />
        </div>
        {status === "sent" && (
          <p className="text-on-surface-variant text-sm">
            Thanks—we got your message and will be in touch.
          </p>
        )}
        {status === "error" && errorMessage && (
          <p className="text-sm text-red-300">{errorMessage}</p>
        )}
        <div className="pt-8">
          <button
            type="submit"
            disabled={status === "sending"}
            className="font-headline inline-flex w-full items-center justify-center gap-2.5 rounded-md bg-white px-6 py-6 text-xl font-medium tracking-tight text-black transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-40"
          >
            {status === "sending" ? "Sending…" : "Send message"}
            <MaterialIcon name="send" className="text-[1.5rem]" />
          </button>
        </div>
      </form>
    </FadeIn>
  );
}
