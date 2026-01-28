import {
	APIEmbed,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	SlashCommandBuilder
} from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("item")
		.setDescription("檢視擁有道具")
		.setDMPermission(false),
	defer: true,
	ephemeral: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const userData = await getUserData(client, interaction.user.id);

		if (!userData.noEffectItems?.size) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["no_items"],
					replyOptions
				)
			);
			return;
		}

		const items = Array.from(userData.noEffectItems.entries());
		const embeds: APIEmbed[] = [];

		Object.assign(replyOptions, {
			totalPages: Math.ceil(userData.noEffectItems.size / 5)
		});

		for (let i = 0; i < userData.noEffectItems.size; i += 5) {
			Object.assign(replyOptions, {
				curPage: i / 5 + 1
			});
			embeds.push({
				author: {
					name: interaction.user.username,
					icon_url:
						interaction.user.avatarURL({
							size: 64
						}) ?? undefined
				},
				description: items
					.slice(i, i + 5)
					.map(([name, counts], index) => {
						index++;
						Object.assign(replyOptions, { index, name, counts });
						return resolveReply(
							client.messages[interaction.commandName]["list_format"],
							replyOptions
						).content!;
					})
					.join("\n"),
				...resolveReply(
					client.messages[interaction.commandName]["display"],
					replyOptions
				)
			});
		}

		let curPage = 1;
		const reply = await interaction.editReply({
			embeds: [embeds[0]],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("item_prev")
						.setLabel("上一頁")
						.setStyle(ButtonStyle.Primary)
						.setDisabled(true),
					new ButtonBuilder()
						.setCustomId("item_next")
						.setLabel("下一頁")
						.setStyle(ButtonStyle.Primary)
						.setDisabled(items.length <= 5)
				)
			]
		});

		if (items.length <= 5) {
			return;
		}

		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === interaction.user.id,
			time: 300000,
			dispose: true
		});

		collector
			.on("collect", async (i) => {
				if (i.customId === "item_prev") {
					curPage--;
					await i.update({
						embeds: [embeds[curPage - 1]],
						components: [
							new ActionRowBuilder<ButtonBuilder>().addComponents(
								new ButtonBuilder()
									.setCustomId("item_prev")
									.setLabel("上一頁")
									.setStyle(ButtonStyle.Primary)
									.setDisabled(curPage === 1),
								new ButtonBuilder()
									.setCustomId("item_next")
									.setLabel("下一頁")
									.setStyle(ButtonStyle.Primary)
							)
						]
					});
				} else {
					curPage++;
					await i.update({
						embeds: [embeds[curPage - 1]],
						components: [
							new ActionRowBuilder<ButtonBuilder>().addComponents(
								new ButtonBuilder()
									.setCustomId("item_prev")
									.setLabel("上一頁")
									.setStyle(ButtonStyle.Primary),
								new ButtonBuilder()
									.setCustomId("item_next")
									.setLabel("下一頁")
									.setStyle(ButtonStyle.Primary)
									.setDisabled(curPage === embeds.length)
							)
						]
					});
				}
			})
			.on("end", async () => {
				await interaction.editReply({
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId("item_prev")
								.setLabel("上一頁")
								.setStyle(ButtonStyle.Primary)
								.setDisabled(true),
							new ButtonBuilder()
								.setCustomId("item_next")
								.setLabel("下一頁")
								.setStyle(ButtonStyle.Primary)
								.setDisabled(true)
						)
					]
				});
			});
	}
};

export default command;
