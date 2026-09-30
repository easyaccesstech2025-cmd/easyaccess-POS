import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbAuth } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;

        // Query master admin (parent_admin_id IS NULL)
        const result = await dbAuth
          .select()
          .from(users)
          .where(
            and(
              eq(users.username, username),
              isNull(users.parentAdminId)
            )
          )
          .limit(1);

        const user = result[0];
        if (!user) return null;

        // Check suspension
        if (user.isSuspended) return null;

        // Verify password (BCrypt or legacy plaintext fallback)
        let isValid = false;
        try {
          isValid = await bcrypt.compare(password, user.password);
        } catch {
          // Fallback to plain comparison for legacy hashes
          isValid = password === user.password;
        }

        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.fullName || user.username,
          email: user.email || user.username,
          role: user.role,
          companyType: user.companyType,
          companyName: user.companyName,
          subscriptionExpiryDate: user.subscriptionExpiryDate,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyType = (user as any).companyType;
        token.companyName = (user as any).companyName;
        token.subscriptionExpiryDate = (user as any).subscriptionExpiryDate;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyType = token.companyType;
        (session.user as any).companyName = token.companyName;
        (session.user as any).subscriptionExpiryDate = token.subscriptionExpiryDate;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
