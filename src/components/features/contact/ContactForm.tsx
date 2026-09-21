"use client";

import { type FormEvent, useState } from "react";
import { FadeIn } from "@/components/atoms/FadeIn";
import { Reveal } from "@/components/atoms/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "@/lib/contact-form";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "@/lib/sites";

const SERVICE_NONE = "__none__";

const SERVICE_OPTIONS = [
  "Website",
  "Web application",
  "Mobile app",
  "Systems / backend",
  "AI integration",
  "Ongoing development",
  "Not sure yet",
] as const;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [service, setService] = useState(SERVICE_NONE);

  const serviceValue = service === SERVICE_NONE ? "" : service;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const selectedService = String(data.get("service") || "").trim();
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
      metadata: selectedService ? { service: selectedService } : undefined,
    });

    if (result.success) {
      setStatus("sent");
      form.reset();
      setService(SERVICE_NONE);
    } else {
      setStatus("error");
      setErrorMessage(result.message);
    }
  }

  return (
    <section
      className="border-outline-variant/10 mx-auto max-w-4xl border-t pt-24"
      id="contact"
    >
      <Reveal className="mb-20 text-center">
        <h2 className="font-headline mb-4 text-5xl font-bold tracking-tighter text-white">
          Start a project
        </h2>
        <p className="text-on-surface-variant text-base">
          Tell us what you need—we&apos;ll get back to you soon.
        </p>
      </Reveal>

      <FadeIn>
        <form className="space-y-12" onSubmit={onSubmit}>
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
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                name="name"
                placeholder="Your name"
                type="text"
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                placeholder="you@company.com"
                type="email"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-service">What do you need?</Label>
            <input type="hidden" name="service" value={serviceValue} />
            <Select value={service} onValueChange={setService}>
              <SelectTrigger
                id="contact-service"
                aria-label="What do you need?"
                className="py-4"
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SERVICE_NONE} disabled className="hidden">
                  Select an option
                </SelectItem>
                {SERVICE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contact-message">Project details</Label>
            <Textarea
              id="contact-message"
              name="message"
              placeholder="Share a short brief, timeline, or goals…"
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
          <div className="flex flex-col gap-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" size="xl" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send message"}
            </Button>
            <div className="flex flex-col gap-2 sm:items-end">
              <a
                href={CONTACT_PHONE_TEL}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={CONTACT_MAILTO}
                className="text-sm text-white/50 transition-colors hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </form>
      </FadeIn>
    </section>
  );
}
