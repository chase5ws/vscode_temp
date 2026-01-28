import { handleButtons } from "../../handlers/buttons.js";
import { handleSlashCommand } from "../../handlers/commands.js";

const event: ClientEvent = {
	name: "interactionCreate",
	lib: "djs",
	run: (client, interaction: import("discord.js").Interaction) => {
		if (!interaction.inCachedGuild()) {
			return;
		}

		if (interaction.isChatInputCommand()) {
			handleSlashCommand(client, interaction);
		}
		if (interaction.isButton()) {
			handleButtons(client, interaction);
		}
	}
};

export default event;
