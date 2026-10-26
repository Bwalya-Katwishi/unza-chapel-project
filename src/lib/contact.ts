/**
 * Normalize a Zambia-facing phone number for tel: and WhatsApp links.
 * Accepts local (09… / 07…) or international (+260…) forms.
 */
export function zambiaPhoneDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("260") && digits.length >= 12) {
    return digits.slice(0, 12);
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    return `260${digits.slice(1, 10)}`;
  }
  if (digits.length === 9 && (digits.startsWith("9") || digits.startsWith("7"))) {
    return `260${digits}`;
  }
  if (digits.length >= 10) return digits;
  return null;
}

export function telHref(raw: string): string | null {
  const digits = zambiaPhoneDigits(raw);
  return digits ? `tel:+${digits}` : null;
}

export function whatsappHref(raw: string): string | null {
  const digits = zambiaPhoneDigits(raw);
  return digits ? `https://wa.me/${digits}` : null;
}
