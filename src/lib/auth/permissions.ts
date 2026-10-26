import {
  BookingAuthority,
  FacilityCode,
  RoleCode,
  type Facility,
  type UserRole,
  type Role,
  type ExceptionalAccessGrant,
} from "@prisma/client";
import { AUTHORITY_FACILITIES, FACILITY_AUTHORITY } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type RoleAssignment = UserRole & { role: Role };

export type AccessContext = {
  userId: string;
  roles: RoleAssignment[];
  exceptional?: ExceptionalAccessGrant[];
};

export function facilityCodeToAuthority(code: FacilityCode): BookingAuthority {
  return FACILITY_AUTHORITY[code];
}

export function isSuperAdmin(ctx: AccessContext) {
  return ctx.roles.some((r) => r.role.code === RoleCode.PLATFORM_SUPER_ADMIN);
}

export function getManagedAuthorities(ctx: AccessContext): BookingAuthority[] {
  const set = new Set<BookingAuthority>();

  for (const assignment of ctx.roles) {
    switch (assignment.role.code) {
      case RoleCode.OVERALL_CHAPLAINCY_ADMIN:
        set.add(BookingAuthority.OVERALL_CHAPLAINCY);
        break;
      case RoleCode.CATHOLIC_SIDE_CHAPEL_ADMIN:
        set.add(BookingAuthority.CATHOLIC_SIDE_CHAPEL);
        break;
      case RoleCode.UCC_PROTESTANT_SIDE_CHAPEL_ADMIN:
        set.add(BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL);
        break;
      default:
        break;
    }
  }

  const now = new Date();
  for (const grant of ctx.exceptional ?? []) {
    if (grant.revokedAt) continue;
    if (grant.expiresAt && grant.expiresAt < now) continue;
    set.add(grant.authority);
  }

  return [...set];
}

export function canManageFacility(ctx: AccessContext, facility: Pick<Facility, "code" | "bookingAuthority" | "id">) {
  if (isSuperAdmin(ctx)) {
    // Super admin configures roles/settings; routine booking approval still requires
    // an authority role or an explicit exceptional grant that is logged.
    const exceptional = (ctx.exceptional ?? []).some(
      (g) =>
        !g.revokedAt &&
        (!g.expiresAt || g.expiresAt > new Date()) &&
        (g.facilityId === facility.id || g.authority === facility.bookingAuthority),
    );
    if (exceptional) return true;
    // Super admin may view system-wide, but not auto-approve side chapels without grant.
    return false;
  }

  const authorities = getManagedAuthorities(ctx);
  return authorities.includes(facility.bookingAuthority);
}

/** Listing media & profile edits — respective authority admins, plus platform super admin. */
export function canEditFacilityListing(
  ctx: AccessContext,
  facility: Pick<Facility, "bookingAuthority" | "id">,
) {
  if (isSuperAdmin(ctx)) return true;
  return getManagedAuthorities(ctx).includes(facility.bookingAuthority);
}

export function canApproveBooking(
  ctx: AccessContext,
  booking: { authority: BookingAuthority; facilityId: string },
) {
  if (isSuperAdmin(ctx)) {
    return (ctx.exceptional ?? []).some(
      (g) =>
        !g.revokedAt &&
        (!g.expiresAt || g.expiresAt > new Date()) &&
        (g.facilityId === booking.facilityId || g.authority === booking.authority),
    );
  }

  return getManagedAuthorities(ctx).includes(booking.authority);
}

export function assertCanApproveBooking(
  ctx: AccessContext,
  booking: { authority: BookingAuthority; facilityId: string },
) {
  if (!canApproveBooking(ctx, booking)) {
    throw new Error("Forbidden: you are not authorised for this booking authority.");
  }
}

export function overallAdminFacilityCodes() {
  return AUTHORITY_FACILITIES.OVERALL_CHAPLAINCY;
}

export async function loadAccessContext(userId: string): Promise<AccessContext> {
  const [roles, exceptional] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    }),
    prisma.exceptionalAccessGrant.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
  ]);

  return { userId, roles, exceptional };
}

export function hasAnyAdminRole(ctx: AccessContext) {
  const adminRoles: RoleCode[] = [
    RoleCode.OVERALL_CHAPLAINCY_ADMIN,
    RoleCode.CATHOLIC_SIDE_CHAPEL_ADMIN,
    RoleCode.UCC_PROTESTANT_SIDE_CHAPEL_ADMIN,
  ];
  return isSuperAdmin(ctx) || ctx.roles.some((r) => adminRoles.includes(r.role.code));
}

export function canAccessOrganisation(
  ctx: AccessContext,
  organisationId: string,
  memberOrgIds: string[],
) {
  if (isSuperAdmin(ctx) || hasAnyAdminRole(ctx)) return true;
  return memberOrgIds.includes(organisationId);
}
