import { SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { formatTime, resolveReply } from "../../utils/botUtils.js";
import { updateRobber } from "../../utils/gameUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("rob")
		.setDescription("搶劫忍者可獲得忍幣（機率20%）")
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(true)
		)
		.setDMPermission(false),
	defer: true,
	game: true,
	run: async (client, interaction, replyOptions) => {
		const target = interaction.options.getUser("member", true);

		Object.assign(replyOptions, {
			user: interaction.user,
			target
		});

		if (target.bot) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_bot"],
					replyOptions
				)
			);
			return;
		}
		if (target.id === interaction.user.id) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_themself"],
					replyOptions
				)
			);
			return;
		}

		const userData = await getUserData(client, interaction.user.id);

		if (userData.coins < 10000) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["too_poor"],
					replyOptions
				)
			);
			return;
		}

		const now = Date.now();
		const targetData = await getUserData(client, target.id);

		if (
			targetData.timestamps.robbed &&
			targetData.timestamps.robbed + 3600000 > now
		) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(targetData.timestamps.robbed + 3600000 - now)
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["on_cd"],
					replyOptions
				)
			);
			return;
		}
		if (
			targetData.gamesData.robCooldown &&
			targetData.gamesData.robCooldown + 3600000 > now
		) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["in_protection"],
					replyOptions
				)
			);
			return;
		}

		let chance = 0.2;
		const data = (await getUserData(client))
			.filter((d) => d.coins)
			.sort((a, b) => b.coins - a.coins);

		if (data.findIndex((d) => d.userId === target.id) < 10) {
			chance = 0.25;
		}

		if (Math.random() > chance || targetData.coins * 0.02 < 1) {
			const penalty = Math.ceil(userData.coins * 0.02);

			Object.assign(replyOptions, {
				amount: penalty.toLocaleString()
			});
			await userData.updateOne({
				$inc: {
					coins: -penalty
				}
			});
			await targetData.updateOne({
				$inc: {
					"gamesData.robAttempts":
						targetData.gamesData.robAttempts + 1 === 5 ? -4 : 1
				},
				$set: {
					"gamesData.robCooldown":
						targetData.gamesData.robAttempts + 1 === 5 ? now : 0
				}
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["failed"],
					replyOptions
				)
			);
		} else {
			const reward = Math.ceil(
				targetData.coins * (Math.random() * 0.95 + 0.05)
			);

			Object.assign(replyOptions, {
				amount: reward.toLocaleString()
			});
			await userData.updateOne({
				$inc: {
					coins: reward,
					"gamesData.robTimes": 1
				}
			});
			await targetData.updateOne({
				$inc: {
					coins: -reward
				},
				$set: {
					"timestamps.robbed": now
				}
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["success"],
					replyOptions
				)
			);
			updateRobber(client, interaction, replyOptions);
		}
	}
};

export default command;
