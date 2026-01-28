import {
	ActionRowBuilder,
	ButtonInteraction,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import Client from "../structures/Client";
import checkGuildVerification from "../utils/checkGuildVerification";

export default async function (
	client: Client<true>,
	interaction: ButtonInteraction
) {
	if (!interaction.customId.startsWith("verify_")) {
		return;
	}

	const modal = new ModalBuilder()
		.setCustomId(`${interaction.customId}_${interaction.createdTimestamp}`)
		.setTitle("驗證程序")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("code")
					.setLabel("驗證碼")
					.setPlaceholder("輸入驗證碼")
					.setRequired(true)
					.setStyle(TextInputStyle.Short)
			)
		);

	await interaction.showModal(modal);

	const modalRes = await interaction
		.awaitModalSubmit({
			filter: (i) =>
				i.user.id === interaction.user.id &&
				i.customId.endsWith(`${interaction.createdTimestamp}`),
			time: 300000,
			dispose: true
		})
		.catch(() => null);
	const guildId = interaction.customId.split("_")[1]!;
	const guild = await client.guilds.fetch(guildId);

	if (!modalRes) {
		const verified = await checkGuildVerification(client, guild);

		if (verified) {
			return;
		}

		await guild.leave();
		await interaction.message.edit({
			embeds: [new EmbedBuilder().setTitle("驗證逾時。").setColor(0)],
			components: []
		});
		logger.debug(`Guild verification timed out: ${guild.name}(${guild.id})`);
		return;
	}
	if (modalRes.fields.getTextInputValue("code") !== client.vCode) {
		await guild.leave();
		await modalRes.deferUpdate();
		await modalRes.editReply({
			embeds: [new EmbedBuilder().setTitle("驗證碼錯誤。").setColor(0)],
			components: []
		});
		logger.debug(`Guild verification failed: ${guild.name}(${guild.id})`);
		return;
	}

	await modalRes.deferUpdate();
	await client.db.rPush("verified_guilds", guildId);
	await modalRes.editReply({
		embeds: [new EmbedBuilder().setTitle("驗證成功。").setColor("White")],
		components: []
	});
	logger.debug(`Guild verified: ${guild.name}(${guild.id})`);
}
