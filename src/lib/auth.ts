import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = getSupabaseAdmin();
        const email = String(credentials.email).toLowerCase();

        const { data: user } = await supabase
          .from("hr_users")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (!user) return null;

        const valid = await bcrypt.compare(String(credentials.password), user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  trustHost: true,
});

export async function requireHRSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
