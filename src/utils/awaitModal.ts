import {
	ChatInputCommandInteraction,
	User,
	ButtonInteraction
} from "discord.js";

export default async function (
	interaction: ChatInputCommandInteraction | ButtonInteraction,
	user?: User,
	customId?: string
) {
	return interaction
		.awaitModalSubmit({
			filter: (i) =>
				(user ? i.user.id === user.id : !i.user.bot) &&
				(customId ? i.customId === customId : true),
			time: 180000,
			dispose: true
		})
		.catch(() => null);
}
