import { FadeIn } from "@/components/atoms/FadeIn";
import { ContactDetails } from "@/components/features/contact/ContactDetails";
import { ContactForm } from "@/components/features/contact/ContactForm";

export function ContactPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-8 pt-32 pb-24">
      <div className="grid items-start gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:gap-20">
        <div>
          <header className="mb-10">
            <FadeIn>
              <h1 className="font-headline mb-4 text-4xl font-bold tracking-tighter text-white md:text-6xl">
                Send us a message
              </h1>
              <p className="text-on-surface-variant text-base">
                Tell us what you need, we&apos;ll get back to you as soon as
                possible.
              </p>
            </FadeIn>
          </header>
          <ContactForm />
        </div>
        <ContactDetails />
      </div>
    </div>
  );
}
