import { productDataDb } from "../mongoose/productData.js";
import { userDataDb } from "../mongoose/userData.js";

export async function getUserData(
	client: import("discord.js").Client<true>,
	id: string
): Promise<import("../mongoose/userData").UserDataDoc>;

export async function getUserData(
	client: import("discord.js").Client<true>
): Promise<import("../mongoose/userData").UserDataDoc[]>;

export async function getUserData(
	client: import("discord.js").Client<true>,
	id?: string
) {
	if (!id) {
		return userDataDb.find({
			guildId: client.config.guildId
		});
	}

	const data = await userDataDb.findOne({
		guildId: client.config.guildId,
		userId: id
	});

	if (!data) {
		return userDataDb.create({
			guildId: client.config.guildId,
			userId: id
		});
	}

	return data;
}

export async function getProductData(
	client: import("discord.js").Client<true>
): Promise<import("../mongoose/productData").ProductDataDoc[]>;

export async function getProductData(
	client: import("discord.js").Client<true>,
	data: {
		name?: string;
		itemType?: number;
		multiplier?: number;
		duration?: number;
	}
): Promise<import("../mongoose/productData").ProductDataDoc | null>;

export async function getProductData(
	client: import("discord.js").Client<true>,
	data?: {
		name?: string;
		itemType?: number;
		multiplier?: number;
		duration?: number;
	}
) {
	if (!data) {
		return productDataDb.find({
			guildId: client.config.guildId
		});
	}

	return productDataDb.findOne({
		...data,
		guildId: client.config.guildId
	});
}
