import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_SMS,
} from "@/lib/sites";

const methods = [
  {
    label: "Email",
    value: CONTACT_EMAIL,
    href: CONTACT_MAILTO,
    icon: "mail",
  },
  {
    label: "Phone",
    value: CONTACT_PHONE_DISPLAY,
    href: CONTACT_PHONE_TEL,
    icon: "call",
  },
  {
    label: "Text",
    value: CONTACT_PHONE_DISPLAY,
    href: CONTACT_SMS,
    icon: "sms",
  },
] as const;

export function ContactDetails() {
  return (
    <aside>
      <h2 className="font-headline mb-8 text-2xl font-bold tracking-tight text-white md:text-3xl">
        Request a free consultation
      </h2>
      <ul className="flex flex-col gap-4">
        {methods.map((method) => (
          <li key={method.label}>
            <a
              href={method.href}
              className="flex items-center gap-4 rounded-lg bg-white px-5 py-4 text-black transition-opacity hover:opacity-90"
            >
              <MaterialIcon name={method.icon} className="text-[1.5rem]" />
              <span>
                <span className="block text-base font-semibold">{method.label}</span>
                <span className="block text-sm text-black/70">{method.value}</span>
              </span>
            </a>
          </li>
        ))}
        <li>
          <div className="flex items-center gap-4 rounded-lg bg-white px-5 py-4 text-black">
            <MaterialIcon name="location_on" className="text-[1.5rem]" />
            <span>
              <span className="block text-base font-semibold">Studio</span>
              <span className="block text-sm text-black/70">Kingwood, TX</span>
            </span>
          </div>
        </li>
      </ul>
    </aside>
  );
}
