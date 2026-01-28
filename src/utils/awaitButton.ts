import { ComponentType, Message, User } from "discord.js";

export default async function (message: Message, user?: User) {
	return message
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			filter: (i) => (user ? i.user.id === user.id : !i.user.bot),
			time: 300000,
			dispose: true
		})
		.catch(() => null);
}
