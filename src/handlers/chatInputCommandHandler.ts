import { ChatInputCommandInteraction } from "discord.js";
import Client from "../structures/Client";
import checkGuildVerification from "../utils/checkGuildVerification";

export default async function (
	client: Client<true>,
	interaction: ChatInputCommandInteraction
) {
	if (!interaction.inGuild()) {
		return;
	}

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		return;
	}

	const guild = await client.guilds.fetch(interaction.guildId);
	const verified = await checkGuildVerification(client, guild);

	if (!verified) {
		logger.debug(
			`@${interaction.user.username} executed /${interaction.commandName}, but guild is not verified: ${guild}(${interaction.guildId})`
		);
		return;
	}

	command.execute(client, interaction);
	logger.debug(
		`@${interaction.user.username} executed /${interaction.commandName}`
	);
}
