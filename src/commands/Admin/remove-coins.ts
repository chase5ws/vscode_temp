import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandUserOption,
	SlashCommandIntegerOption
} from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("remove-coins")
		.setDescription("管理員指令：將忍者村某人的忍幣納入國庫")
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(true)
		)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("amount")
				.setDescription("金額")
				.setMinValue(1)
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

		const amount = interaction.options.getInteger("amount", true);
		const targetData = await getUserData(client, target.id);

		Object.assign(replyOptions, {
			amount: amount.toLocaleString()
		});

		if (amount > targetData.coins) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["amount_too_large"],
					replyOptions
				)
			);
			return;
		}

		await targetData.updateOne({
			$inc: {
				coins: -amount
			}
		});
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["coins_removed"],
				replyOptions
			)
		);
	}
};

export default command;
