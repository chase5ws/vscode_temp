import { Event } from "../types";
import checkGuildVerification from "../utils/checkGuildVerification";

export default {
	name: "guildDelete",
	listener: async (client, guild) => {
		logger.debug(`Left guild: ${guild.name}(${guild.id})`);

		const verified = await checkGuildVerification(client, guild);

		if (verified) {
			await client.db.lRem("verified_guilds", 1, guild.id);
		}
	}
} as Event<"guildDelete">;
