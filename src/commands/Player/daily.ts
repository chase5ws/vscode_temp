import { SlashCommandBuilder } from "discord.js";
import { getSignReward } from "../../utils/gameUtils.js";
import { formatTime, msTillEnd, resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("每日 08:00 刷新冷卻，可領取 1,000 ~ 5,000")
		.setDMPermission(false),
	defer: true,
	game: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const userData = await getUserData(client, interaction.user.id);

		if (userData.dailyCommand.onCooldown) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(msTillEnd())
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["on_cd"],
					replyOptions
				)
			);
			return;
		}

		const reward = getSignReward(client, userData.dailyCommand.streak + 1);
		const extra = (userData.dailyCommand.streak + 1) % 5 === 0 ? 10000 : 0;

		Object.assign(replyOptions, {
			amount: reward.toLocaleString(),
			streak: userData.dailyCommand.streak + 1,
			mo_streak: userData.dailyCommand.monthStreak + 1
		});
		await userData.updateOne({
			$inc: {
				coins: reward + extra,
				"dailyCommand.streak": 1,
				"dailyCommand.monthStreak": 1
			},
			$set: {
				"dailyCommand.onCooldown": true
			}
		});
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["get_reward"],
				replyOptions
			)
		);

		if (extra) {
			Object.assign(replyOptions, {
				amount: extra.toLocaleString()
			});
			await interaction.followUp(
				resolveReply(
					client.messages[interaction.commandName]["get_extra"],
					replyOptions
				)
			);
		}
		if (
			userData.dailyCommand.monthStreak + 1 ===
			client.config.commands.daily.monthly_role.counts
		) {
			Object.assign(replyOptions, {
				counts: client.config.commands.daily.monthly_role.counts,
				role: `<@&${client.config.commands.daily.monthly_role.id}>`
			});
			await interaction.member.roles.add(
				client.config.commands.daily.monthly_role.id
			);
			await interaction.followUp(
				resolveReply(
					client.messages[interaction.commandName]["get_role"],
					replyOptions
				)
			);
		}
	}
};

export default command;
