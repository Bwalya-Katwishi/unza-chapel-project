import { customAlphabet } from "nanoid";

const alphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 4);

export function generateBookingReference(prefix = "UNC") {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${y}${m}${d}-${alphabet()}`;
}

export function generateSeriesReference() {
  return generateBookingReference("UNS");
}

export function generateReceiptNumber() {
  return generateBookingReference("RCPT");
}
