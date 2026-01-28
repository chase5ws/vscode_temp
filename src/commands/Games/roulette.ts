import {
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption
} from "discord.js";
import {
	gameRequest,
	isItemWorking,
	rouletteDecision,
	updateGambler
} from "../../utils/gameUtils.js";
import { delay, formatTime, resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("roulette")
		.setDescription("玩家指令：俄羅斯轉盤")
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

		if (
			userData.timestamps.roulette &&
			userData.timestamps.roulette + 3600000 > now
		) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(userData.timestamps.roulette + 3600000 - now)
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
		if (amount * 4 > userData.coins) {
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
			opponent: opp
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

			if (amount * 4 > oppData.coins) {
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

		const chamber = [0, 0, 0, 0, 0, 1];
		let bullet = 0;
		let round = 0;
		let userLose = false;
		let userGiveup = false;
		let oppLose = false;

		while (round < (opp ? 6 : 5)) {
			Object.assign(replyOptions, {
				reward: amount * round
			});
			if (
				await rouletteDecision(
					client,
					interaction,
					interaction.user,
					replyOptions
				)
			) {
				chamber.sort(() => Math.random() - 0.5);

				bullet = chamber.shift()!;

				if (bullet) {
					userLose = true;

					await interaction.followUp(
						resolveReply(
							client.messages[interaction.commandName]["dead"],
							replyOptions
						)
					);
					break;
				}

				round++;
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["survived"],
						replyOptions
					)
				);
				await delay(1250);
			} else {
				userGiveup = true;
				break;
			}

			Object.assign(replyOptions, {
				reward: amount * round
			});
			if (
				opp &&
				(await rouletteDecision(client, interaction, opp, replyOptions))
			) {
				chamber.sort(() => Math.random() - 0.5);

				bullet = chamber.shift()!;

				if (bullet) {
					oppLose = true;

					await interaction.followUp(
						resolveReply(client.messages[interaction.commandName]["dead"], {
							...replyOptions,
							user: opp
						})
					);
					break;
				}

				round++;
				await interaction.followUp(
					resolveReply(client.messages[interaction.commandName]["survived"], {
						...replyOptions,
						user: opp
					})
				);
				await delay(1250);
			} else if (opp) {
				break;
			}
		}

		if (userLose || !round) {
			await userData.updateOne({
				$inc: {
					coins: -amount,
					"gamesData.gambleTimes": 1
				},
				$set: {
					"timestamps.roulette": now,
					"gamesData.ingame": false
				}
			});

			if (!opp || userGiveup) {
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["lose"],
						replyOptions
					)
				);
			}
		} else if ((userGiveup && !opp) || !userGiveup) {
			const reward = Math.round(
				round *
					amount *
					(interaction.member.roles.cache.has(client.config.roles.gambler)
						? 1.2
						: 1)
			);

			Object.assign(replyOptions, {
				amount: reward.toLocaleString()
			});
			await userData.updateOne({
				$inc: {
					coins: reward,
					"gamesData.gambleTimes": 1
				},
				$set: {
					"timestamps.roulette": now,
					"gamesData.ingame": false
				}
			});
			await interaction.followUp(
				resolveReply(
					client.messages[interaction.commandName]["win"],
					replyOptions
				)
			);
		}

		updateGambler(client, interaction, replyOptions);

		if (opp) {
			const oppData = await getUserData(client, opp.id);

			if (oppLose) {
				await oppData.updateOne({
					$inc: {
						coins: -amount
					}
				});
			} else if (round && (userGiveup || userLose)) {
				const reward = Math.round(
					round *
						amount *
						((await interaction.guild.members.fetch(opp)).roles.cache.has(
							client.config.roles.gambler
						)
							? 1.2
							: 1)
				);

				Object.assign(replyOptions, {
					amount: reward.toLocaleString()
				});
				await oppData.updateOne({
					$inc: {
						coins: reward
					}
				});

				await interaction.followUp(
					resolveReply(client.messages[interaction.commandName]["win"], {
						...replyOptions,
						user: opp
					})
				);
			}
		}
	}
};

export default command;
