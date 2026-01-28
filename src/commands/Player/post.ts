import {
	ActionRowBuilder,
	EmbedBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	TextBasedChannel,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("post")
		.setDescription("匿名發文")
		.setDMPermission(false),
	run: async (client, interaction, replyOptions) => {
		await interaction.showModal(
			new ModalBuilder()
				.setCustomId(`post-content-${interaction.createdTimestamp}`)
				.setTitle("匿名發文")
				.addComponents(
					new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("content")
							.setLabel("內文")
							.setStyle(TextInputStyle.Paragraph)
							.setRequired(true)
					)
				)
		);

		const modal = await interaction
			.awaitModalSubmit({
				filter: (i) =>
					i.user.id === interaction.user.id &&
					i.customId.endsWith(`${interaction.createdTimestamp}`),
				time: 300000,
				dispose: true
			})
			.catch(() => null);

		if (!modal) {
			return;
		}

		await modal.deferReply({ ephemeral: true });

		const channel = (await client.channels.fetch(
			client.config.channels.post
		)) as TextBasedChannel;

		Object.assign(replyOptions, {
			user: interaction.user
		});

		await channel.send({
			content: `<@&${client.config.roles.post_notif}>`,
			embeds: [
				new EmbedBuilder()
					.setDescription(modal.fields.getTextInputValue("content"))
					.setColor("Random")
			]
		});
		await modal.editReply(
			resolveReply(
				client.messages[interaction.commandName]["sent"],
				replyOptions
			)
		);
	}
};

export default command;
