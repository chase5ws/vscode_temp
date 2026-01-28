import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType
} from "discord.js";
import { delay, resolveReply } from "./botUtils.js";

export async function recruit(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	Object.assign(replyOptions, {
		host: interaction.user,
		players: "\u200b",
		timestamp: `<t:${Math.round(Date.now() / 1000 + 60)}:R>`
	});

	const players: import("discord.js").User[] = [];
	const msg = await interaction.editReply({
		...resolveReply(
			client.messages[interaction.commandName]["recruit_msg"],
			replyOptions
		),
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("join_war")
					.setEmoji("⚔️")
					.setLabel("加入戰鬥")
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId("quit_war")
					.setEmoji("🏃")
					.setLabel("離開戰鬥")
					.setStyle(ButtonStyle.Secondary)
			)
		]
	});
	const collector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (i) => !i.user.bot,
		time: 60000,
		dispose: true
	});

	collector
		.on("collect", async (i) => {
			Object.assign(replyOptions, {
				user: i.user
			});
			await i.deferReply({
				ephemeral: true
			});

			switch (i.customId) {
				case "join_war":
					if (players.some((p) => p.id === i.user.id)) {
						await i.editReply(
							resolveReply(
								client.messages[interaction.commandName]["alr_joined"],
								replyOptions
							)
						);
						return;
					}

					players.push(i.user);

					if (players.length === 30) {
						collector.stop();
					}

					await i.editReply(
						resolveReply(
							client.messages[interaction.commandName]["joined"],
							replyOptions
						)
					);
					break;
				case "quit_war":
					if (!players.some((p) => p.id === i.user.id)) {
						await i.editReply(
							resolveReply(
								client.messages[interaction.commandName]["not_joined"],
								replyOptions
							)
						);
						return;
					}

					players.splice(
						players.findIndex((p) => p.id === i.user.id),
						1
					);
					await i.editReply(
						resolveReply(
							client.messages[interaction.commandName]["quit"],
							replyOptions
						)
					);
					break;
			}

			Object.assign(replyOptions, {
				players: players.length ? players.join(", ") : "\u200b"
			});
			await i.message.edit(
				resolveReply(
					client.messages[interaction.commandName]["recruit_msg"],
					replyOptions
				)
			);
		})
		.on("end", async () => {
			await interaction.editReply({
				components: []
			});
		});

	await delay(60000);
	return players;
}

export function randomEvent(
	client: import("discord.js").Client<true>,
	type: "normal" | "death" | "respawn",
	usedEvents: string[]
) {
	const available = client.config.commands.war.events[type].filter(
		(raw) => !usedEvents.some((e) => e === raw)
	);

	if (!available.length) {
		return;
	}

	return available[Math.floor(Math.random() * available.length)];
}

export function randomPlayer(
	players: import("discord.js").User[],
	exceptions: import("discord.js").User[]
) {
	const available = players.filter(
		(p) => !exceptions.some((u) => u.id === p.id)
	);

	if (!available.length) {
		return;
	}

	return available[Math.floor(Math.random() * available.length)];
}
