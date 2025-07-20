import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!user[0]) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user[0].password || ''
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name || undefined,
            role: user[0].role,
            avatar: user[0].avatar || undefined,
            membershipTier: user[0].membershipTier || 'free',
            membershipExpiresAt: user[0].membershipExpiresAt?.toISOString(),
            createdAt: user[0].createdAt?.toISOString(),
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.membershipTier = user.membershipTier;
        token.membershipExpiresAt = user.membershipExpiresAt;
      }

      // 处理会话更新
      if (trigger === 'update' && session) {
        // 重新从数据库获取用户信息
        try {
          const updatedUser = await db
            .select({
              id: users.id,
              role: users.role,
              membershipTier: users.membershipTier,
              membershipExpiresAt: users.membershipExpiresAt,
            })
            .from(users)
            .where(eq(users.id, token.id as string))
            .limit(1);

          if (updatedUser.length > 0) {
            token.role = updatedUser[0].role;
            token.membershipTier = updatedUser[0].membershipTier;
            token.membershipExpiresAt = updatedUser[0].membershipExpiresAt?.toISOString();
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.membershipTier = token.membershipTier as string;
        session.user.membershipExpiresAt = token.membershipExpiresAt as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function createUser(email: string, password: string, name?: string, role: 'user' | 'admin' = 'user') {
  const hashedPassword = await bcrypt.hash(password, 12);
  
  try {
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role,
      })
      .returning();

    return newUser[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}
