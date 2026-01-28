import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandUserOption,
	SlashCommandIntegerOption,
	SlashCommandRoleOption
} from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("spawn-coins")
		.setDescription("管理員指令：由國庫支出忍幣給予忍者村的某人")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("amount")
				.setDescription("金額")
				.setMinValue(1)
				.setRequired(true)
		)
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(false)
		)
		.addRoleOption(
			new SlashCommandRoleOption()
				.setName("role")
				.setDescription("身分組")
				.setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		const target = interaction.options.getUser("member", false);
		const role = interaction.options.getRole("role", false);

		Object.assign(replyOptions, {
			user: target,
			role
		});

		if (!target && !role) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["no_target"],
					replyOptions
				)
			);
			return;
		}
		if (role?.managed) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_bot_role"],
					replyOptions
				)
			);
			return;
		}

		const amount = interaction.options.getInteger("amount", true);

		Object.assign(replyOptions, {
			amount: amount.toLocaleString()
		});

		if (target) {
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

			await targetData.updateOne({
				$inc: {
					coins: amount
				}
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["coins_given_member"],
					replyOptions
				)
			);
		} else if (role) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["processing"],
					replyOptions
				)
			);

			const members = (await interaction.guild.members.fetch())
				.filter((m) => m.roles.cache.has(role.id) && !m.user.bot)
				.map((m) => m);
			let promises = [];

			for (const member of members) {
				promises.push(getUserData(client, member.id));
			}

			const data = await Promise.all(promises);
			promises = [];

			for (const d of data) {
				promises.push(
					d.updateOne({
						$inc: {
							coins: amount
						}
					})
				);
			}

			await Promise.all(promises);
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["coins_given_role"],
					replyOptions
				)
			);
		}
	}
};

export default command;
