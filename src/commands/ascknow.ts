import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder
} from "discord.js";
import { Command } from "../types";
import parseXlsx from "../utils/parseXlsx";

export default {
	data: new SlashCommandBuilder().setName("ascknow").setDescription("智慧王"),
	execute: async (_client, interaction) => {
		await interaction.deferReply();

		const data = parseXlsx("ascknow")?.filter((qa) => qa.length <= 26);

		if (!data?.length) {
			return;
		}

		const answered: string[] = [];
		const index = Math.floor(Math.random() * data.length);

		const question = await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setDescription(`# ${data[index]![0]}`)
					.setFooter({ text: "3分鐘搶答！" })
					.setColor("Random")
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					data[index]!.slice(2).map((ans, i) =>
						new ButtonBuilder()
							.setCustomId(`ascknow_${interaction.createdTimestamp}_${i + 1}`)
							.setLabel(ans)
							.setStyle(ButtonStyle.Secondary)
					)
				)
			]
		});

		const collector = question.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter: (i) => !i.user.bot && !answered.includes(i.user.id),
			time: 180000,
			dispose: true
		});

		collector
			.on("collect", async (i) => {
				const selected = i.customId.split("_")[2]!;

				if (selected === data[index]![1]!.toString()) {
					collector.stop();
					await i.update({
						embeds: [
							new EmbedBuilder()
								.setDescription(
									`# ${data[index]![0]}\n> <@${i.user.id}> 答對！`
								)
								.setFooter({ text: "3分鐘搶答！" })
								.setColor("DarkGrey")
						],
						components: []
					});
				} else {
					answered.push(i.user.id);
					await i.reply({
						content: "答案錯誤。",
						ephemeral: true
					});
				}
			})
			.on("end", async (_collected, reason) => {
				if (reason === "time") {
					await interaction.editReply({
						components: []
					});
				}
			});
	}
} as Command;
