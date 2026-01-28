import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandUserOption
} from "discord.js";
import { userDataDb } from "../../mongoose/userData.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("cool")
		.setDescription("管理員指令：重置玩家遊戲冷卻")
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		const target = interaction.options.getUser("member", true);

		Object.assign(replyOptions, {
			user: target
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

		await userDataDb.findOneAndUpdate(
			{
				guildId: client.config.guildId,
				userId: target.id
			},
			{
				$unset: {
					"timestamps.dice": 0,
					"timestamps.roulette": 0,
					"timestamps.rps": 0,
					"timestamps.guess": 0
				}
			}
		);
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["reset"],
				replyOptions
			)
		);
	}
};

export default command;
