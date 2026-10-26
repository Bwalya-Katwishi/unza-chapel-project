import { BookingAuthority, FacilityCode, RoleCode } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canApproveBooking,
  canEditFacilityListing,
  canManageFacility,
  facilityCodeToAuthority,
  getManagedAuthorities,
  type AccessContext,
} from "@/lib/auth/permissions";

function ctx(roles: RoleCode[], exceptional: AccessContext["exceptional"] = []): AccessContext {
  return {
    userId: "user-1",
    roles: roles.map((code, idx) => ({
      id: `ur-${idx}`,
      userId: "user-1",
      roleId: `role-${idx}`,
      authority: null,
      facilityId: null,
      grantedAt: new Date(),
      grantedBy: null,
      notes: null,
      role: {
        id: `role-${idx}`,
        code,
        name: code,
        description: null,
        createdAt: new Date(),
      },
    })),
    exceptional,
  };
}

describe("booking authority boundaries", () => {
  it("maps facilities to correct authorities", () => {
    expect(facilityCodeToAuthority(FacilityCode.MAIN_CHAPEL)).toBe(BookingAuthority.OVERALL_CHAPLAINCY);
    expect(facilityCodeToAuthority(FacilityCode.READING_ROOM)).toBe(BookingAuthority.OVERALL_CHAPLAINCY);
    expect(facilityCodeToAuthority(FacilityCode.CONFERENCE_ROOM)).toBe(BookingAuthority.OVERALL_CHAPLAINCY);
    expect(facilityCodeToAuthority(FacilityCode.CATHOLIC_SIDE_CHAPEL)).toBe(BookingAuthority.CATHOLIC_SIDE_CHAPEL);
    expect(facilityCodeToAuthority(FacilityCode.PROTESTANT_SIDE_CHAPEL)).toBe(
      BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL,
    );
  });

  it("allows overall admin only for overall facilities", () => {
    const overall = ctx([RoleCode.OVERALL_CHAPLAINCY_ADMIN]);
    expect(getManagedAuthorities(overall)).toEqual([BookingAuthority.OVERALL_CHAPLAINCY]);
    expect(
      canManageFacility(overall, {
        id: "f1",
        code: FacilityCode.MAIN_CHAPEL,
        bookingAuthority: BookingAuthority.OVERALL_CHAPLAINCY,
      }),
    ).toBe(true);
    expect(
      canApproveBooking(overall, {
        authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
        facilityId: "cath",
      }),
    ).toBe(false);
    expect(
      canApproveBooking(overall, {
        authority: BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL,
        facilityId: "ucc",
      }),
    ).toBe(false);
  });

  it("keeps catholic and ucc admins independent", () => {
    const catholic = ctx([RoleCode.CATHOLIC_SIDE_CHAPEL_ADMIN]);
    const ucc = ctx([RoleCode.UCC_PROTESTANT_SIDE_CHAPEL_ADMIN]);

    expect(
      canApproveBooking(catholic, {
        authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
        facilityId: "cath",
      }),
    ).toBe(true);
    expect(
      canApproveBooking(catholic, {
        authority: BookingAuthority.UCC_PROTESTANT_SIDE_CHAPEL,
        facilityId: "ucc",
      }),
    ).toBe(false);
    expect(
      canApproveBooking(ucc, {
        authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
        facilityId: "cath",
      }),
    ).toBe(false);
  });

  it("lets respective admins and super admin edit facility listing media", () => {
    const overall = ctx([RoleCode.OVERALL_CHAPLAINCY_ADMIN]);
    const catholic = ctx([RoleCode.CATHOLIC_SIDE_CHAPEL_ADMIN]);
    const superAdmin = ctx([RoleCode.PLATFORM_SUPER_ADMIN]);

    expect(
      canEditFacilityListing(overall, {
        id: "f1",
        bookingAuthority: BookingAuthority.OVERALL_CHAPLAINCY,
      }),
    ).toBe(true);
    expect(
      canEditFacilityListing(overall, {
        id: "cath",
        bookingAuthority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
      }),
    ).toBe(false);
    expect(
      canEditFacilityListing(catholic, {
        id: "cath",
        bookingAuthority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
      }),
    ).toBe(true);
    expect(
      canEditFacilityListing(superAdmin, {
        id: "cath",
        bookingAuthority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
      }),
    ).toBe(true);
  });

  it("denies super admin automatic side-chapel approval without exceptional grant", () => {
    const superAdmin = ctx([RoleCode.PLATFORM_SUPER_ADMIN]);
    expect(
      canApproveBooking(superAdmin, {
        authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
        facilityId: "cath",
      }),
    ).toBe(false);

    const granted = ctx([RoleCode.PLATFORM_SUPER_ADMIN], [
      {
        id: "g1",
        userId: "user-1",
        authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
        facilityId: "cath",
        reason: "Temporary covering leave",
        grantedById: "user-1",
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
      },
    ]);

    expect(
      canApproveBooking(granted, {
        authority: BookingAuthority.CATHOLIC_SIDE_CHAPEL,
        facilityId: "cath",
      }),
    ).toBe(true);
  });
});
