import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandNumberOption
} from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("season")
		.setDescription("管理員指令：賽季重置")
		.addNumberOption(
			new SlashCommandNumberOption()
				.setName("percent")
				.setDescription("重置百分比")
				.setMinValue(0)
				.setMaxValue(100)
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const percent = interaction.options.getNumber("percent", true);

		Object.assign(replyOptions, { percent });

		if (!percent) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["invalid_percent"],
					replyOptions
				)
			);
			return;
		}

		const data = (await getUserData(client)).filter((d) =>
			Math.floor(d.coins * (percent / 100))
		);

		for (const userData of data) {
			await userData.updateOne({
				$inc: {
					coins: -Math.floor(userData.coins * (percent / 100))
				}
			});
		}

		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["reset"],
				replyOptions
			)
		);
	}
};

export default command;
