import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	SlashCommandBuilder
} from "discord.js";
import { getProductData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("列出忍者村商店商品")
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const products = await getProductData(client);

		if (!products.length) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["empty"],
					replyOptions
				)
			);
			return;
		}

		Object.assign(replyOptions, {
			curPage: 1,
			totalPages: Math.ceil(products.length / 10)
		});

		const msgData = {
			...resolveReply(
				client.messages[interaction.commandName]["display"],
				replyOptions
			)
		} as ReturnType<typeof resolveReply>;

		Object.assign(msgData, {
			component: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("prev")
						.setLabel("上一頁")
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId("next")
						.setLabel("下一頁")
						.setStyle(ButtonStyle.Success)
				)
			]
		});

		for (let i = 0; i < products.slice(0, 10).length; i++) {
			Object.assign(replyOptions, {
				index: i + 1,
				name: products[i].name,
				price: products[i].price.toLocaleString()
			});
			msgData.embeds![0].addFields({
				name: resolveReply(
					client.messages[interaction.commandName]["field_format"]["name"],
					replyOptions
				).content!,
				value: resolveReply(
					client.messages[interaction.commandName]["field_format"]["value"],
					replyOptions
				).content!
			});
		}

		const reply = await interaction.editReply(msgData);

		reply
			.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: (i) => i.user.id === interaction.user.id,
				time: 300000,
				dispose: true
			})
			.on("collect", async (i) => {
				await i.deferUpdate();

				const totalPages = parseInt(
					i.message.embeds[0].footer!.text.split("/")[1]
				);
				let curPage = parseInt(i.message.embeds[0].footer!.text.split("/")[0]);

				switch (i.customId) {
					case "prev":
						if (curPage === 1) {
							curPage = totalPages;
						} else {
							curPage--;
						}
						break;
					case "next":
						if (curPage === totalPages) {
							curPage = 1;
						} else {
							curPage++;
						}
						break;
				}

				msgData.embeds![0].spliceFields(0, -1);
				msgData.embeds![0].setFooter({
					text: `${curPage}/${totalPages}`
				});

				for (let i = 0; i < 10; i++) {
					Object.assign(replyOptions, {
						index: i + 1,
						name: products.slice(i * 10, (i + 1) * 10)[i].name,
						price: products
							.slice(i * 10, (i + 1) * 10)
							[i].price.toLocaleString()
					});
					msgData.embeds![0].addFields({
						name: resolveReply(
							client.messages[interaction.commandName]["field_format"]["name"],
							replyOptions
						).content!,
						value: resolveReply(
							client.messages[interaction.commandName]["field_format"]["value"],
							replyOptions
						).content!
					});
				}

				await i.editReply(msgData);
			});
	}
};

export default command;
