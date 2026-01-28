import { SlashCommandBuilder } from "discord.js";
import { formatTime, resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("spring")
		.setDescription("Spring command")
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const now = Date.now();
		const userData = await getUserData(client, interaction.user.id);

		if (
			userData.timestamps.spring &&
			userData.timestamps.spring + 3600000 > now
		) {
			Object.assign(replyOptions, {
				timeRemains: formatTime(userData.timestamps.spring + 3600000 - now)
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["on_cd"],
					replyOptions
				)
			);
			return;
		}

		if (Math.random() < client.config.commands.spring.chance / 100) {
			await userData.updateOne({
				$inc: {
					coins: 5000
				},
				$set: {
					"timestamps.spring": now
				}
			});
			await interaction.editReply(
				resolveReply(
					client.config.commands.spring.replies.success[
						Math.floor(
							Math.random() *
								client.config.commands.spring.replies.success.length
						)
					],
					replyOptions
				)
			);

			if (
				!interaction.member.roles.cache.has(client.config.commands.spring.role)
			) {
				await interaction.member.roles.add(client.config.commands.spring.role);
			}
		} else {
			await userData.updateOne({
				$set: {
					"timestamps.spring": now
				}
			});
			await interaction.editReply(
				resolveReply(
					client.config.commands.spring.replies.fail[
						Math.floor(
							Math.random() * client.config.commands.spring.replies.fail.length
						)
					],
					replyOptions
				)
			);
		}
	}
};

export default command;
