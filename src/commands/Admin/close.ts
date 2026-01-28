import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { settingsDataDb } from "../../mongoose/settingsData.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("close")
		.setDescription("kill/rob開關")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	defer: true,
	ephemeral: true,
	run: async (client, interaction, replyOptions) => {
		const settings = await settingsDataDb.findOne({
			guildId: client.config.guildId
		});

		if (!settings) {
			await settingsDataDb.create({
				guildId: client.config.guildId,
				krSwitch: false
			});
		} else {
			await settings.updateOne({
				krSwitch: !settings.krSwitch
			});
		}

		Object.assign(replyOptions, {
			user: interaction.user
		});

		if (!settings || settings.krSwitch) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["closed"],
					replyOptions
				)
			);
		} else {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["opened"],
					replyOptions
				)
			);
		}
	}
};

export default command;
