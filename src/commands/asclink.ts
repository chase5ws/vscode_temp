import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	SlashCommandBuilder
} from "discord.js";
import { readFileSync } from "fs";
import { join } from "path";
import { Command } from "../types";
import parseXlsx from "../utils/parseXlsx";
import awaitButton from "../utils/awaitButton";
import buttonPages from "../utils/buttonPages";

export default {
	data: new SlashCommandBuilder().setName("asclink").setDescription("連結清單"),
	execute: async (_client, interaction) => {
		await interaction.deferReply();

		const terms = readFileSync(
			join(__dirname, "..", "..", "data", "asclink_terms.txt"),
			{ encoding: "utf-8" }
		);

		const button = await interaction
			.editReply({
				content: terms,
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("asclink_terms_accept")
							.setLabel("同意")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId("asclink_terms_reject")
							.setLabel("拒絕")
							.setStyle(ButtonStyle.Danger)
					)
				]
			})
			.then((message) => awaitButton(message, interaction.user));

		if (button?.customId !== "asclink_terms_accept") {
			await interaction.deleteReply();
			return;
		}

		const data = parseXlsx("asclink");

		if (!data) {
			await button.update({
				content: "清單中尚無資料。",
				components: []
			});
			return;
		}

		const embeds: EmbedBuilder[] = [];

		for (let i = 0; i < data.length; i++) {
			embeds.push(
				new EmbedBuilder()
					.setAuthor({
						name: data[i]![0]!,
						url: data[i]![1]
					})
					.setThumbnail(data[i]![3] ?? null)
					.setDescription(data[i]![2]!)
					.setColor("White")
			);
		}

		if (embeds.length > 3) {
			const mapped: EmbedBuilder[][] = [];

			for (let i = 0; i < embeds.length; i += 3) {
				mapped.push(embeds.slice(i, Math.min(i + 3, embeds.length)));
			}

			await buttonPages(
				button,
				mapped.map((e) => ({ content: null, embeds: e }))
			);
		} else {
			await button.update({
				content: null,
				components: [],
				embeds: embeds
			});
		}
	}
} as Command;
