import Image from "next/image";
import Link from "next/link";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "@/lib/sites";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-[#131313] px-8 py-12">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-6 md:flex-row">
        <Link href="/" className="inline-flex items-center" aria-label="Trashbox LLC home">
          <Image
            src="/images/trashbox-logo-outlined.svg"
            alt="Trashbox LLC logo"
            width={1024}
            height={1024}
            className="size-16"
          />
        </Link>
        <div className="flex flex-wrap justify-center gap-8">
          <a
            className="font-body text-xs text-white/50 transition-colors hover:text-white"
            href={CONTACT_MAILTO}
          >
            {CONTACT_EMAIL}
          </a>
          <a
            className="font-body text-xs text-white/50 transition-colors hover:text-white"
            href={CONTACT_PHONE_TEL}
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
        <p className="font-body text-center text-xs text-white/50 md:text-right">
          © {year} trashbox llc. Web development by{" "}
          <a
            href="https://trashbox.io/"
            className="text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            Trashbox
          </a>
        </p>
      </div>
    </footer>
  );
}
