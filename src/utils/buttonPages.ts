import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	InteractionEditReplyOptions
} from "discord.js";

export default async function (
	interaction: ChatInputCommandInteraction | ButtonInteraction,
	data: InteractionEditReplyOptions[]
) {
	const prevBtn = new ButtonBuilder()
		.setCustomId("pages_previous")
		.setLabel("上一頁")
		.setStyle(ButtonStyle.Secondary);
	const nextBtn = new ButtonBuilder()
		.setCustomId("pages_next")
		.setLabel("下一頁")
		.setStyle(ButtonStyle.Secondary);

	let curPage = 0;
	const message = await (interaction.isButton()
		? interaction.update({
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						prevBtn.setDisabled(true),
						nextBtn
					)
				],
				...data[curPage]
			})
		: interaction.editReply({
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						prevBtn.setDisabled(true),
						nextBtn
					)
				],
				...data[curPage]
			}));

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (i) => i.user.id === interaction.user.id,
		time: 300000,
		dispose: true
	});

	collector.on("collect", async (i) => {
		if (i.customId === "pages_previous") {
			curPage--;
		} else {
			curPage++;
		}

		await i.update({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					prevBtn.setDisabled(curPage === 0),
					nextBtn.setDisabled(curPage === data.length - 1)
				)
			],
			...data[curPage]
		});
	});
	collector.on("end", async () => {
		await interaction.editReply({
			components: []
		});
	});
}
