import { contactInitials } from "@/components/features/portal/contacts/contact-display";
import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "size-9 text-xs",
  lg: "size-14 text-lg",
  xl: "size-24 text-3xl",
} as const;

interface ContactAvatarProps {
  displayName: string;
  size?: keyof typeof sizeClass;
  className?: string;
}

export function ContactAvatar({
  displayName,
  size = "sm",
  className,
}: ContactAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-surface-container-highest font-label text-on-surface-variant grid shrink-0 place-content-center rounded-full",
        sizeClass[size],
        className,
      )}
    >
      {contactInitials(displayName)}
    </span>
  );
}
