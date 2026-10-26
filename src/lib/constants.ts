import { BookingAuthority, FacilityCode, RoleCode } from "@prisma/client";

export const APP_NAME = "UNZA Chapel & Community Portal";
export const APP_TIMEZONE = "Africa/Lusaka";
export const CURRENCY = "ZMW";

export const FACILITY_AUTHORITY: Record<FacilityCode, BookingAuthority> = {
  MAIN_CHAPEL: BookingAuthority.OVERALL_CHAPLAINCY,
  READING_ROOM: BookingAuthority.OVERALL_CHAPLAINCY,
  CONFERENCE_ROOM: BookingAuthority.OVERALL_CHAPLAINCY,
  CATHOLIC_SIDE_CHAPEL: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
  PROTESTANT_SIDE_CHAPEL: BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL,
};

export const AUTHORITY_FACILITIES: Record<BookingAuthority, FacilityCode[]> = {
  OVERALL_CHAPLAINCY: [
    FacilityCode.MAIN_CHAPEL,
    FacilityCode.READING_ROOM,
    FacilityCode.CONFERENCE_ROOM,
  ],
  CATHOLIC_SIDE_CHAPEL: [FacilityCode.CATHOLIC_SIDE_CHAPEL],
  UCC_PROTESTANT_SIDE_CHAPEL: [FacilityCode.PROTESTANT_SIDE_CHAPEL],
};

export const AUTHORITY_LABELS: Record<BookingAuthority, string> = {
  OVERALL_CHAPLAINCY: "Overall UNZA Chaplaincy Administrator",
  CATHOLIC_SIDE_CHAPEL: "Catholic Side Chapel Administrator",
  UCC_PROTESTANT_SIDE_CHAPEL: "UCC / Protestant Side Chapel Administrator",
};

export const ROLE_LABELS: Record<RoleCode, string> = {
  PLATFORM_SUPER_ADMIN: "Platform Super Administrator",
  OVERALL_CHAPLAINCY_ADMIN: "Overall Chaplaincy Administrator",
  CATHOLIC_SIDE_CHAPEL_ADMIN: "Catholic Side Chapel Administrator",
  UCC_PROTESTANT_SIDE_CHAPEL_ADMIN: "UCC / Protestant Side Chapel Administrator",
  ORGANISATION_REPRESENTATIVE: "Organisation Representative",
  INDIVIDUAL_BOOKER: "Individual Booker",
  PUBLIC_VISITOR: "Public Visitor",
};

export const EVENT_TYPE_LABELS = {
  WEDDING: "Wedding",
  CONCERT: "Concert",
  PRAYER_NIGHT: "Prayer Night",
  WORSHIP_SERVICE: "Worship Service",
  CONFERENCE: "Conference",
  FELLOWSHIP_MEETING: "Fellowship Meeting",
  OTHER: "Other",
} as const;

export const BOOKING_STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
} as const;

/** Primary header links — keep to five or fewer. */
export const NAV_PRIMARY = [
  { href: "/", label: "Home" },
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
  { href: "/bookings/request", label: "Book a space" },
  { href: "/about", label: "About" },
] as const;

/** Secondary links for footer / mobile “More” sheet. */
export const NAV_MORE = [
  { href: "/facilities", label: "Facilities" },
  { href: "/calendar", label: "Availability" },
  { href: "/announcements", label: "Announcements" },
  { href: "/articles", label: "Articles" },
  { href: "/policies", label: "Policies" },
  { href: "/contact", label: "Contact" },
] as const;

/** @deprecated Use NAV_PRIMARY + NAV_MORE */
export const NAV_PUBLIC = [...NAV_PRIMARY, ...NAV_MORE] as const;

export const CHAPEL_HERO_IMAGE = "/images/communities/unza-chapel-cover.jpg";
