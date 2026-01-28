import { SlashCommandBuilder } from "discord.js";
import { randomEvent, randomPlayer, recruit } from "../../utils/warUtils.js";
import { delay, resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("war")
		.setDescription("管理員指令：使用秘術開啟忍界大戰")
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		if (
			!interaction.member.roles.cache.has(client.config.roles.war_host) &&
			!interaction.member.permissions.has("Administrator")
		) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["no_perm"],
					replyOptions
				)
			);
			return;
		}

		const players = await recruit(client, interaction, replyOptions);

		if (players.length < 2) {
			await interaction.followUp(
				resolveReply(
					client.messages[interaction.commandName]["no_players"],
					replyOptions
				)
			);
			return;
		}

		const rewards =
			players.length <= 10
				? client.config.commands.war.rewards[0]
				: players.length <= 20
				? client.config.commands.war.rewards[1]
				: client.config.commands.war.rewards[2];

		Object.assign(replyOptions, {
			counts: players.length,
			players: players.join("\n"),
			reward_1: rewards[0].toLocaleString(),
			reward_2: rewards[1].toLocaleString(),
			reward_3: rewards[2].toLocaleString()
		});
		await interaction.followUp(
			resolveReply(
				client.messages[interaction.commandName]["show_info"],
				replyOptions
			)
		);
		await delay(3000);

		const winners: import("discord.js").User[] = [];
		const totalRounds = Math.floor(Math.random() * 10 + 3);
		const deadPlayers: import("discord.js").User[] = [];
		let usedPlayers: import("discord.js").User[] = [];
		let usedEvents: string[] = [];
		let formattedEvents: string[] = [];
		let eventCounts: number;
		let eventType: "normal" | "death" | "respawn";
		let rawEvent;
		let player: import("discord.js").User | undefined;
		let killer: import("discord.js").User | undefined;

		for (
			let i = 1;
			i <= totalRounds || players.length - deadPlayers.length > 1;
			i++
		) {
			if (players.length - deadPlayers.length === 1) {
				break;
			}

			Object.assign(replyOptions, {
				round: i
			});

			eventCounts = Math.round(Math.random() * 12);

			if (!eventCounts) {
				Object.assign(replyOptions, {
					events: "此回合沒有發生任何事情。",
					counts: players.length - deadPlayers.length
				});
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["show_events"],
						replyOptions
					)
				);
				continue;
			}

			player = undefined;
			killer = undefined;
			formattedEvents = [];
			usedPlayers = [];
			usedEvents = [];

			for (let j = 0; j < eventCounts; j++) {
				if (players.length - deadPlayers.length === 1) {
					break;
				}

				if (
					Math.random() < i / totalRounds &&
					(players.length - deadPlayers.length >= 3 || i >= 3)
				) {
					eventType = "death";
				} else if (Math.random() < 0.1 && deadPlayers.length) {
					eventType = "respawn";
				} else {
					eventType = "normal";
				}

				rawEvent = randomEvent(client, eventType, usedEvents);

				if (!rawEvent) {
					continue;
				}

				switch (eventType) {
					case "normal":
						player = randomPlayer(players, [...usedPlayers, ...deadPlayers]);

						if (!player) {
							break;
						}

						Object.assign(replyOptions, {
							user: player
						});
						usedPlayers.push(player);
						usedEvents.push(rawEvent);
						formattedEvents.push(resolveReply(rawEvent, replyOptions).content!);
						break;
					case "death":
						player = randomPlayer(players, [...usedPlayers, ...deadPlayers]);

						if (!player) {
							break;
						}

						killer = randomPlayer(players, [
							...usedPlayers,
							...deadPlayers,
							player
						]);

						if (!killer) {
							break;
						}

						Object.assign(replyOptions, {
							user: player,
							killer
						});
						usedPlayers.push(player, killer);
						usedEvents.push(rawEvent);
						deadPlayers.push(player);
						formattedEvents.push(resolveReply(rawEvent, replyOptions).content!);

						if (players.length - deadPlayers.length < 3) {
							winners.push(player);
						}
						break;
					case "respawn":
						player = randomPlayer(players, [
							...usedPlayers,
							...players.filter((p) => !deadPlayers.some((d) => d.id === p.id))
						]);

						if (!player) {
							break;
						}

						Object.assign(replyOptions, {
							user: player
						});
						usedPlayers.push(player);
						usedEvents.push(rawEvent);
						deadPlayers.splice(
							deadPlayers.findIndex((p) => p.id === player!.id),
							1
						);
						formattedEvents.push(resolveReply(rawEvent, replyOptions).content!);

						if (players.length - deadPlayers.length === 3) {
							winners.pop();
						}
						break;
				}

				if (players.length - deadPlayers.length === 1) {
					winners.push(
						players.find((p) => !deadPlayers.some((d) => d.id === p.id))!
					);
					break;
				}
			}

			winners.reverse();
			Object.assign(replyOptions, {
				events: formattedEvents.join("\n"),
				counts: players.length - deadPlayers.length
			});
			await interaction.followUp(
				resolveReply(
					client.messages[interaction.commandName]["show_events"],
					replyOptions
				)
			);

			if (players.length - deadPlayers.length > 1) {
				await delay(15000);
			}
		}

		Object.assign(replyOptions, {
			winners: winners.map((w, i) => `第${i + 1}名：${w}`).join("\n")
		});
		await interaction.followUp(
			resolveReply(
				client.messages[interaction.commandName]["show_winners"],
				replyOptions
			)
		);

		for (const winner of winners) {
			const reward = rewards.shift();

			getUserData(client, winner.id).then(async (d) => {
				await d.updateOne({
					$inc: {
						coins: reward
					}
				});
			});
		}
	}
};

export default command;
