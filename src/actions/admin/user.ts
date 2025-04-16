import { defineAction } from 'astro:actions';
import db from '@/lib/db';
import { usersTable } from '@/db/schema'; // Ensure usersTable is exported correctly from this module

export const getUsers = defineAction({
  handler: async ({ limit = 10, offset = 0 }) => {
    const users = await db
      .select()
      .from(usersTable)
      .limit(limit)
      .offset(offset);

    const total = await db.count().from(usersTable).then((count: { count: number }[]) => count[0].count);
    return {
      data: users,
      total,
    };
  },
});

export const createUser = defineAction({
  handler: async (values: { name: string; email: string }) => {
    const { error } = await db.insert(usersTable).values(values);
    return { error };
  },
});

export const updateUser = defineAction({
  handler: async (values: { id: number; name: string; email: string }) => {
    const { error } = await db.update(usersTable).set(values).where(eq(usersTable.id, values.id));
    return { error };
  },
});

export const deleteUser = defineAction({
  handler: async (values: { id: number }) => {
    try {
      await db.delete(usersTable).where(eq(usersTable.id, values.id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },
});


