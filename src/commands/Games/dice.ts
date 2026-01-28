import {
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption
} from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { delay, formatTime, resolveReply } from "../../utils/botUtils.js";
import {
	gameRequest,
	isItemWorking,
	rollDice,
	updateGambler
} from "../../utils/gameUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("dice")
		.setDescription("玩家指令：骰子遊戲")
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

		if (userData.timestamps.dice && userData.timestamps.dice + 3600000 > now) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(userData.timestamps.dice + 3600000 - now)
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

		if (amount > client.config.bet_limit.dice * multiplier) {
			Object.assign(replyOptions, {
				amount: client.config.bet_limit.dice * multiplier
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["over_limit"],
					replyOptions
				)
			);
			return;
		}
		if (amount * 2 > userData.coins) {
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

			if (amount * 2 > oppData.coins) {
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

		let userState: number[] = [];
		let oppState: number[] = [];
		let content = "";

		do {
			userState = rollDice();
			oppState = rollDice();
			// First roll
			Object.assign(replyOptions, {
				die_1: userState[0],
				die_2: userState[1]
			});
			content += `\n${
				resolveReply(
					client.messages[interaction.commandName]["first_roll"],
					replyOptions
				).content
			}`;
			await interaction.editReply({
				content: content.trim(),
				embeds: []
			});
			await delay(1250);
			// Second roll
			Object.assign(replyOptions, {
				die_1: oppState[0],
				die_2: oppState[1]
			});
			content += `\n${
				resolveReply(
					client.messages[interaction.commandName]["second_roll"],
					replyOptions
				).content
			}`;
			await interaction.editReply(content.trim());
			await delay(1250);

			if (userState[2] === oppState[2]) {
				content += `\n${
					resolveReply(
						client.messages[interaction.commandName]["even"],
						replyOptions
					).content
				}`;
				await interaction.editReply(content);
				await delay(1250);
			}
		} while (userState[2] === oppState[2]);

		if (userState[2] > oppState[2]) {
			const reward =
				amount *
				(userState[0] === userState[1] ? 2 : 1) *
				(interaction.member.roles.cache.has(client.config.roles.gambler)
					? 1.2
					: 1);

			Object.assign(replyOptions, {
				amount: reward.toLocaleString()
			});
			await userData.updateOne({
				$inc: {
					coins: reward
				}
			});

			if (opp) {
				getUserData(client, opp.id).then(async (d) => {
					await d.updateOne({
						$inc: {
							coins: -amount * (userState[0] === userState[1] ? 2 : 1)
						}
					});
				});
			}

			content += `\n${
				resolveReply(
					client.messages[interaction.commandName]["win"],
					replyOptions
				).content
			}`;
		}
		if (oppState[2] > userState[2]) {
			if (opp) {
				const reward =
					amount *
					(userState[0] === userState[1] ? 2 : 1) *
					((await interaction.guild.members.fetch(opp)).roles.cache.has(
						client.config.roles.gambler
					)
						? 1.2
						: 1);

				Object.assign(replyOptions, {
					amount: reward.toLocaleString(),
					user: opp
				});
				getUserData(client, opp.id).then(async (d) => {
					await d.updateOne({
						$inc: {
							coins: reward
						}
					});
				});

				content += `\n${
					resolveReply(
						client.messages[interaction.commandName]["win"],
						replyOptions
					).content
				}`;
			} else {
				Object.assign(replyOptions, {
					amount: (
						amount * (userState[0] === userState[1] ? 2 : 1)
					).toLocaleString()
				});

				content += `\n${
					resolveReply(
						client.messages[interaction.commandName]["lose"],
						replyOptions
					).content
				}`;
			}

			await userData.updateOne({
				$inc: {
					coins: -amount * (userState[0] === userState[1] ? 2 : 1)
				}
			});
		}

		await userData.updateOne({
			$inc: {
				"gamesData.gambleTimes": 1
			},
			$set: {
				"timestamps.dice": now
			}
		});
		await interaction.editReply(content);
		updateGambler(client, interaction, replyOptions);
	}
};

export default command;
