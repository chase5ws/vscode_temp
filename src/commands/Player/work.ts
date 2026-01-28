import { SlashCommandBuilder } from "discord.js";
import { isItemWorking, updateWorker } from "../../utils/gameUtils.js";
import { formatTime, resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("work")
		.setDescription("每工作一個小時可得 1,000 ~ 3,000 忍幣")
		.setDMPermission(false),
	defer: true,
	game: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const userData = await getUserData(client, interaction.user.id);

		if (
			client.config.commands.work.limit &&
			userData.workCommand.times >= client.config.commands.work.limit
		) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["reached_limit"],
					replyOptions
				)
			);
			return;
		}

		const now = Date.now();

		if (userData.timestamps.work && userData.timestamps.work + 3600000 > now) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(userData.timestamps.work + 3600000 - now)
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["on_cd"],
					replyOptions
				)
			);
			return;
		}

		let salary = Math.floor(Math.random() * 2000 + 1000);
		const roles = client.config.commands.work.roles;

		if (interaction.member.roles.cache.has(roles.tier_4.id)) {
			salary = Math.floor(
				Math.random() * (roles.tier_4.max - roles.tier_4.min) + roles.tier_4.min
			);
		} else if (interaction.member.roles.cache.has(roles.tier_3.id)) {
			salary = Math.floor(
				Math.random() * (roles.tier_3.max - roles.tier_3.min) + roles.tier_3.min
			);
		} else if (interaction.member.roles.cache.has(roles.tier_2.id)) {
			salary = Math.floor(
				Math.random() * (roles.tier_2.max - roles.tier_2.min) + roles.tier_2.min
			);
		} else if (interaction.member.roles.cache.has(roles.tier_1.id)) {
			salary = Math.floor(
				Math.random() * (roles.tier_1.max - roles.tier_1.min) + roles.tier_1.min
			);
		}
		if (isItemWorking(userData.items[ItemType.IncWorkReward])) {
			salary = Math.floor(
				salary * userData.items[ItemType.IncWorkReward].multiplier + 1
			);
		}

		const amount = userData.workCommand.unclaimSalary ?? 0;

		Object.assign(replyOptions, {
			coins: (userData.coins + amount).toLocaleString(),
			salary: salary.toLocaleString(),
			amount: amount.toLocaleString()
		});
		await userData.updateOne({
			$inc: {
				coins: amount,
				"workCommand.times": 1
			},
			$set: {
				"timestamps.work": now,
				"workCommand.unclaimSalary": salary
			}
		});
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["working"],
				replyOptions
			)
		);

		updateWorker(client, interaction, replyOptions);
	}
};

export default command;
