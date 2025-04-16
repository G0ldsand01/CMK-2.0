import { actions } from 'astro:actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { usersTable } from '@/db/schema';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddUserForm } from './AddUserForm';
import { EditUserForm } from './EditUsersForms';
import { toast } from 'react-hot-toast';

type User = typeof usersTable.$inferSelect;

interface UsersTableProps {
  initialUsers: User[];
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await actions.admin.user.getUsers();
    if (!error) {
      setUsers(data);
    } else {
      setError(error.message || 'Failed to fetch users');
    }
    setIsLoading(false);
  };

  const handleDelete = async (userId: number) => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (!confirm) return;

    setLoadingId(userId);
    try {
      const { error } = await actions.admin.user.deleteUser({ id: userId });

      if (!error) {
        toast.success('User deleted');
        await fetchUsers();
      } else {
        toast.error(error.message || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('An error occurred while deleting the user');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUserUpdated = async () => {
    await fetchUsers();
  };

  const handleUserAdded = async () => {
    await fetchUsers();
  };

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            fetchUsers();
          }}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUserForm onUserAdded={handleUserAdded} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <EditUserForm
                      user={user}
                      onUserUpdated={handleUserUpdated}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loadingId === user.id}
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
