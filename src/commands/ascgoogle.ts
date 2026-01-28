import {
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandStringOption
} from "discord.js";
import { Command } from "../types";
import parseXlsx from "../utils/parseXlsx";
import buttonPages from "../utils/buttonPages";

export default {
	data: new SlashCommandBuilder()
		.setName("ascgoogle")
		.setDescription("社群字典")
		.addStringOption(
			new SlashCommandStringOption()
				.setName("keyword")
				.setDescription("關鍵字。")
				.setRequired(false)
		),
	execute: async (_client, interaction) => {
		await interaction.deferReply();

		const data = parseXlsx("ascgoogle");

		if (!data) {
			await interaction.editReply("字典中尚無資料。");
			return;
		}

		const key = interaction.options.getString("keyword", false);

		if (key) {
			const value = data.find(([k]) => k === key)?.[1];

			if (!value) {
				await interaction.editReply("字典中無相關資料。");
				return;
			}

			await interaction.editReply(`**${key}**：${value}`);
			return;
		}

		const embeds: EmbedBuilder[] = [];

		for (let i = 0; i < data.length; i += 5) {
			embeds.push(
				new EmbedBuilder()
					.addFields(
						data
							.slice(i, i + 5)
							.map(([name, value]) => ({ name: name!, value: value! }))
					)
					.setColor("Fuchsia")
			);
		}

		if (embeds.length === 1) {
			await interaction.editReply({ embeds });
			return;
		}

		await buttonPages(
			interaction,
			embeds.map((e) => ({ embeds: [e] }))
		);
	}
} as Command;
