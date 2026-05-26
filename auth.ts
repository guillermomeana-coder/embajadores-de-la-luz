import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [Google],
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        // Pull role from the adapter's user doc (stored in users collection)
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection('users').findOne({ email: user.email });
        session.user.role = (dbUser?.role as string) ?? 'donor';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
