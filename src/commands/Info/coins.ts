import { SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("coins")
		.setDescription("取得自己的忍幣數量")
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(false)
		)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		const target = interaction.options.getUser("member") ?? interaction.user;

		Object.assign(replyOptions, {
			user: target
		});

		if (target.id === client.user.id) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_client"],
					replyOptions
				)
			);
			return;
		}
		if (target.bot) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_bot"],
					replyOptions
				)
			);
			return;
		}

		const targetData = await getUserData(client, target.id);

		Object.assign(replyOptions, {
			amount: targetData.coins.toLocaleString()
		});

		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["display"],
				replyOptions
			)
		);
	}
};

export default command;
