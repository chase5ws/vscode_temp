import { SlashCommandBuilder, SlashCommandIntegerOption } from "discord.js";
import {
	getGuessReward,
	isItemWorking,
	updateGambler
} from "../../utils/gameUtils.js";
import { formatTime, resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("guess")
		.setDescription("玩家指令：猜數字遊戲")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("amount")
				.setDescription("投注金額")
				.setMinValue(1)
				.setRequired(true)
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
			userData.timestamps.guess &&
			userData.timestamps.guess + 3600000 > now
		) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(userData.timestamps.guess + 3600000 - now)
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

		if (amount > client.config.bet_limit.guess * multiplier) {
			Object.assign(replyOptions, {
				amount: (client.config.bet_limit.guess * multiplier).toLocaleString()
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

		let reward = 0;
		const number = Math.floor(Math.random() * 100) + 1;
		let min = 1;
		let max = 100;
		let input;

		Object.assign(replyOptions, { number });

		for (let i = 0; i < 5; i++) {
			Object.assign(replyOptions, { min, max });

			if (interaction.replied) {
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["show_range"],
						replyOptions
					)
				);
			} else {
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["show_range"],
						replyOptions
					)
				);
			}

			const collected = await interaction
				.channel!.awaitMessages({
					filter: ({ author, content }) =>
						author.id === interaction.user.id && !isNaN(parseInt(content)),
					time: 180000,
					max: 1,
					dispose: true
				})
				.then((c) => c.first())
				.catch(() => null);

			if (!collected) {
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["timed_out"],
						replyOptions
					)
				);
				break;
			}

			input = parseInt(collected.content);

			if (input === number) {
				reward = getGuessReward(
					amount,
					i,
					interaction.member.roles.cache.has(client.config.roles.gambler)
				);

				Object.assign(replyOptions, {
					amount: reward.toLocaleString()
				});
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["correct"],
						replyOptions
					)
				);
				break;
			}
			if (i === 4) {
				await interaction.followUp(
					resolveReply(
						client.messages[interaction.commandName]["failed"],
						replyOptions
					)
				);
				break;
			}
			if (input < min || input > max) {
				continue;
			} else if (input < number) {
				min = input + 1;
			} else if (input > number) {
				max = input - 1;
			}
		}

		await userData.updateOne({
			$inc: {
				coins: input === number ? reward : -amount,
				"gamesData.gambleTimes": 1
			},
			$set: {
				"timestamps.guess": now
			}
		});
		updateGambler(client, interaction, replyOptions);
	}
};

export default command;
