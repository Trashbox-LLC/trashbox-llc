import { FadeIn } from "@/components/atoms/FadeIn";
import { ContactForm } from "@/components/features/contact/ContactForm";

export function ContactPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-8 pt-32 pb-24">
      <header className="mx-auto mb-20 max-w-4xl text-center">
        <FadeIn>
          <h1 className="font-headline mb-4 text-5xl font-bold tracking-tighter text-white md:text-7xl">
            Send us a message
          </h1>
          <p className="text-on-surface-variant text-base">
            Tell us what you need, we&apos;ll get back to you as soon as possible.
          </p>
        </FadeIn>
      </header>
      <ContactForm />
    </div>
  );
}
