import db from '@/lib/db'; // Ensure you have a database connection set up

// Function to get all users
export async function getAllUsers() {
    return await db.user.findMany(); // Assuming you use Prisma
}

// Function to update user role
export async function updateUser(id, role) {
    return await db.user.update({
        where: { id },
        data: { role },
    });
}

// Function to delete a user
export async function deleteUser(id) {
    return await db.user.delete({
        where: { id },
    });
}
