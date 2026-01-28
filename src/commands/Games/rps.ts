import {
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption
} from "discord.js";
import { delay, formatTime, resolveReply } from "../../utils/botUtils.js";
import {
	gameRequest,
	isItemWorking,
	rpsDecision,
	rpsStateToStr,
	updateGambler
} from "../../utils/gameUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("rps")
		.setDescription("玩家指令：猜拳遊戲")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("amount")
				.setDescription("投注金額")
				.setMinValue(1)
				.setRequired(true)
		)
		.addUserOption(
			new SlashCommandUserOption()
				.setName("opponent")
				.setDescription("對手")
				.setRequired(false)
		)
		.setDMPermission(false),
	defer: true,
	game: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const now = Date.now();
		const userData = await getUserData(client, interaction.user.id);

		if (userData.timestamps.rps && userData.timestamps.rps + 3600000 > now) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(userData.timestamps.rps + 3600000 - now)
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["on_cd"],
					replyOptions
				)
			);
			return;
		}

		const amount = interaction.options.getInteger("amount", true);
		let multiplier = 1;

		if (isItemWorking(userData.items[ItemType.IncBetAmt])) {
			multiplier += userData.items[ItemType.IncBetAmt].multiplier;
		}

		Object.assign(replyOptions, {
			amount: amount.toLocaleString()
		});

		if (amount > client.config.bet_limit.roulette * multiplier) {
			Object.assign(replyOptions, {
				amount: (client.config.bet_limit.roulette * multiplier).toLocaleString()
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["over_limit"],
					replyOptions
				)
			);
			return;
		}
		if (amount > userData.coins) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["amount_too_large"],
					replyOptions
				)
			);
			return;
		}

		const opp = interaction.options.getUser("opponent", false);

		Object.assign(replyOptions, {
			opponent: opp ?? "你的對手"
		});

		if (opp?.bot) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_bot"],
					replyOptions
				)
			);
			return;
		}
		if (opp?.id === interaction.user.id) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_themself"],
					replyOptions
				)
			);
			return;
		}

		if (opp) {
			const oppData = await getUserData(client, opp.id);

			if (amount > oppData.coins) {
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["opp_poor"],
						replyOptions
					)
				);
				return;
			}

			const request = await gameRequest(client, interaction, replyOptions);

			if (!request) {
				return;
			}

			await delay(2000);
		}

		let userState;
		let userLose = false;
		let oppState;
		let oppLose = false;

		do {
			userState = rpsDecision(
				client,
				interaction,
				interaction.user,
				replyOptions
			);

			if (opp) {
				oppState = rpsDecision(client, interaction, opp, replyOptions);
			} else {
				oppState = Math.round(Math.random() * 2) as 0 | 1 | 2;
			}

			userState = await userState;
			oppState = await oppState;

			if (typeof userState !== "number" || typeof oppState !== "number") {
				break;
			}

			let content = "";

			Object.assign(replyOptions, {
				state_user: rpsStateToStr(userState),
				state_opponent: rpsStateToStr(oppState)
			});
			content += resolveReply(
				client.messages[interaction.commandName]["show_result"],
				replyOptions
			).content!;

			const msg = await interaction.followUp(content);

			if (userState === oppState) {
				content += `\n${
					resolveReply(
						client.messages[interaction.commandName]["even"],
						replyOptions
					).content
				}`;
				await msg.edit(content);
			} else if (userState - oppState === 1 || userState - oppState === -2) {
				oppLose = true;

				Object.assign(replyOptions, {
					amount: Math.round(
						amount *
							(interaction.member.roles.cache.has(client.config.roles.gambler)
								? 1.2
								: 1)
					).toLocaleString()
				});
				content += `\n${
					resolveReply(
						client.messages[interaction.commandName]["win"],
						replyOptions
					).content
				}`;
				await msg.edit(content);
			} else if (opp) {
				userLose = true;

				Object.assign(replyOptions, {
					amount: Math.round(
						amount *
							((await interaction.guild.members.fetch(opp)).roles.cache.has(
								client.config.roles.gambler
							)
								? 1.2
								: 1)
					).toLocaleString()
				});
				content += `\n${
					resolveReply(client.messages[interaction.commandName]["win"], {
						...replyOptions,
						user: opp
					}).content
				}`;
				await msg.edit(content);
			} else {
				userLose = true;

				content += `\n${
					resolveReply(
						client.messages[interaction.commandName]["lose"],
						replyOptions
					).content
				}`;
				await msg.edit(content);
			}
		} while (userState === oppState);

		if (typeof userState !== "number" && typeof oppState !== "number") {
			await interaction.followUp(
				resolveReply(
					client.messages[interaction.commandName]["no_response"],
					replyOptions
				)
			);
			return;
		}

		await userData.updateOne({
			$inc: {
				coins: userLose
					? -amount
					: parseInt(replyOptions["amount"].replace(/,/g, "")),
				"gamesData.gambleTimes": 1
			},
			$set: {
				"timestamps.rps": now,
				"gamesData.ingame": false
			}
		});

		if (opp && userLose) {
			getUserData(client, opp.id).then(async (d) => {
				await d.updateOne({
					$inc: {
						coins: parseInt(replyOptions["amount"].replace(/,/g, ""))
					}
				});
			});
		}
		if (oppLose) {
			updateGambler(client, interaction, replyOptions);
		}
	}
};

export default command;
