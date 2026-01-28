import { EmbedBuilder, Message, PartialMessage } from "discord.js";

export default function (message: Message | PartialMessage) {
	const embeds: EmbedBuilder[] = [];
	const attachments = Array.from(message.attachments.values());

	embeds.push(
		new EmbedBuilder()
			.setURL("https://cdn.discordapp.com")
			.setDescription(
				`@${message.author?.username}：\n${message.content ?? ""}`.trim()
			)
			.setThumbnail(message.author?.avatarURL({ size: 64 }) ?? null)
			.setImage(
				attachments.length ? `attachment://${attachments[0]!.name}` : null
			)
			.setColor("Grey")
	);

	for (let i = 1; i < attachments.length; i++) {
		embeds.push(
			new EmbedBuilder()
				.setURL("https://cdn.discordapp.com")
				.setImage(`attachment://${attachments[i]!.name}`)
		);
	}

	return embeds;
}
