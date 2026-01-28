import { Event } from "../types";

export default {
	name: "ready",
	listener: async (client) => {
		await client.deployCommands();
		logger.info(`${client.user.tag} is ready.`);
	}
} as Event<"ready">;
