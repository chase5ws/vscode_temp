import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../types";
import randomDigits from "../utils/randomDigits";

export default {
	data: new SlashCommandBuilder()
		.setName("ascpass")
		.setDescription("產生授權密碼")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	execute: async (client, interaction) => {
		if (interaction.user.id !== process.env["OWNER_ID"]) {
			return;
		}

		await interaction.deferReply({
			ephemeral: true
		});

		let code;

		do {
			code = randomDigits(6);
		} while (client.vCode && code === client.vCode);

		client.vCode = code;
		await interaction.editReply({
			content: `已更新授權密碼：\`${client.vCode}\``
		});
	}
} as Command;
