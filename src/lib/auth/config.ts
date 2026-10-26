import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { RoleCode } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            roles: { include: { role: true } },
          },
        });

        if (!user || !user.isActive) return null;
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        await writeAuditLog({
          actorId: user.id,
          action: AuditAction.LOGIN,
          entityType: "User",
          entityId: user.id,
          summary: `User signed in: ${user.email}`,
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          roles: user.roles.map((r) => ({
            code: r.role.code as RoleCode,
            authority: r.authority,
            facilityId: r.facilityId,
          })),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles ?? [];
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
