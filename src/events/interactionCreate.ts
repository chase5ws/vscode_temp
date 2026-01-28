import getHandler from "../handlers";
import { Event } from "../types";

export default {
	name: "interactionCreate",
	listener: async (client, interaction) => {
		if (interaction.user.bot) {
			return;
		}

		if (interaction.isChatInputCommand()) {
			(await getHandler("chatInputCommand"))(client, interaction);
		}
		if (interaction.isButton()) {
			(await getHandler("button"))(client, interaction);
		}
	}
} as Event<"interactionCreate">;
