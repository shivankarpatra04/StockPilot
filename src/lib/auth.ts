import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // We use JWT strategy for credentials - no adapter needed for the basic flow
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || !user.password) {
            console.log("[Auth] User not found or no password set");
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            console.log("[Auth] Invalid password");
            return null;
          }

          return { id: user.id, email: user.email, name: user.name };
        } catch (err) {
          console.error("[Auth] Database error during sign-in:", err);
          return null;
        }
      },
    }),
    // Google provider can be added here later
    /*
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    */
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
