import { and, eq } from 'drizzle-orm';
import type { UserRole } from '@/db/schema';
import { productsTable, usersTable, wishlistTable } from '@/db/schema';
import type { CMKUser as IUser } from '@/lib/auth';
import db from '../db';

class User {
	private request: Request;

	private id: string;
	private name: string;
	private email: string;
	private image: string;
	private firstName: string;
	private lastName: string;
	private phone: string;
	private address: string;
	private city: string;
	private state: string;
	private zip: string;
	private country: string;
	private role: UserRole;

	constructor(request: Request, user: IUser) {
		if (!user.id || !user.name || !user.email || !user.role) {
			throw new Error('User is not valid');
		}

		this.request = request;

		this.id = user.id;
		this.name = user.name;
		this.email = user.email;
		this.role = user.role;

		this.image = user.image || '';
		this.firstName = user.firstName || '';
		this.lastName = user.lastName || '';
		this.phone = user.phone || '';
		this.address = user.address || '';
		this.city = user.city || '';
		this.state = user.state || '';
		this.zip = user.zip || '';
		this.country = user.country || '';
	}

	getId(): string {
		return this.id;
	}
	getDisplayName(): string {
		return this.name;
	}
	getEmail(): string {
		return this.email;
	}
	getImage(): string {
		return this.image;
	}
	getRole(): UserRole {
		return this.role;
	}
	getFirstName(): string {
		return this.firstName;
	}
	getLastName(): string {
		return this.lastName;
	}
	getPhone(): string {
		return this.phone;
	}
	getAddress(): string {
		return this.address;
	}
	getCity(): string {
		return this.city;
	}
	getState(): string {
		return this.state;
	}
	getZip(): string {
		return this.zip;
	}
	getCountry(): string {
		return this.country;
	}
	isAdmin(): boolean {
		return this.role === 'admin';
	}

	async setDetails(details: Partial<IUser>) {
		if (details.firstName) {
			this.firstName = details.firstName;
		}
		if (details.lastName) {
			this.lastName = details.lastName;
		}
		if (details.phone) {
			this.phone = details.phone;
		}
		if (details.address) {
			this.address = details.address;
		}
		if (details.city) {
			this.city = details.city;
		}
		if (details.state) {
			this.state = details.state;
		}
		if (details.zip) {
			this.zip = details.zip;
		}
		if (details.country) {
			this.country = details.country;
		}

		await this.save();
	}

	async setRole(role: UserRole) {
		this.role = role;
		await this.save();
	}

	getDetails(): IUser {
		return {
			...this,
			role: this.role as UserRole,
		};
	}

	private async save() {
		await db
			.update(usersTable)
			.set(this.getDetails())
			.where(eq(usersTable.id, this.id));
	}

	// Wishlist
	async getWishlist() {
		const wishlist = await db
			.select()
			.from(wishlistTable)
			.where(eq(wishlistTable.userId, this.id))
			.innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id));

		return wishlist;
	}

	async addToWishlist(productId: number) {
		await db.insert(wishlistTable).values({
			userId: this.id,
			productId,
		});
	}

	async removeFromWishlist(productId: number) {
		await db
			.delete(wishlistTable)
			.where(
				and(
					eq(wishlistTable.userId, this.id),
					eq(wishlistTable.productId, productId),
				),
			);
	}
}

export default User;
