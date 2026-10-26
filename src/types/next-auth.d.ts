import { BookingAuthority, RoleCode } from "@prisma/client";
import { DefaultSession } from "next-auth";

export type SessionRole = {
  code: RoleCode;
  authority?: BookingAuthority | null;
  facilityId?: string | null;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: SessionRole[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: SessionRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: SessionRole[];
  }
}
