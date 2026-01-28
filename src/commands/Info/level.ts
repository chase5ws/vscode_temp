import { SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";
import { requiredExp } from "../../utils/levelingUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("level")
		.setDescription("查看聊天等級")
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(false)
		)
		.setDMPermission(false),
	defer: true,
	leveling: true,
	run: async (client, interaction, replyOptions) => {
		const target =
			interaction.options.getUser("member", false) ?? interaction.user;

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

		const targetData = await getUserData(client, target.id);

		Object.assign(replyOptions, {
			exp: targetData.exp?.toLocaleString() ?? 0,
			level: targetData.level?.toLocaleString() ?? 0,
			reqExp: requiredExp((targetData.level ?? 0) + 1)
		});
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["show_level"],
				replyOptions
			)
		);
	}
};

export default command;
