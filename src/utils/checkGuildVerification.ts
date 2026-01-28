import { Guild } from "discord.js";
import Client from "../structures/Client";

export default async function (client: Client, guild: Guild) {
	const verified = await client.db.lPos("verified_guilds", guild.id);

	if (verified === null && guild.ownerId === process.env["OWNER_ID"]) {
		await client.db.rPush("verified_guilds", guild.id);
		return true;
	} else if (verified === null) {
		return false;
	}

	return true;
}
