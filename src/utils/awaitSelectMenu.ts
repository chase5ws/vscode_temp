import { ComponentType, Message, User } from "discord.js";

export default async function (
	message: Message,
	type: ComponentType.StringSelect,
	user?: User
) {
	return message
		.awaitMessageComponent({
			componentType: type,
			filter: (i) => (user ? i.user.id === user.id : !i.user.bot),
			time: 180000,
			dispose: true
		})
		.catch(() => null);
}
