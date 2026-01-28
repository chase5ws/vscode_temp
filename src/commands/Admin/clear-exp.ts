import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandRoleOption,
	SlashCommandUserOption
} from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("clear-exp")
		.setDescription("清除所有聊天經驗")
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
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const target = interaction.options.getUser("member", false);

		if (target) {
			Object.assign(replyOptions, { target });

			if (target.bot) {
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["is_bot"],
						replyOptions
					)
				);
				return;
			}

			getUserData(client, target.id).then(async (d) => {
				await d.updateOne({
					$set: {
						exp: 0
					}
				});
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["cleared_for_target"],
					replyOptions
				)
			);
			return;
		}

		const role = interaction.options.getRole("role", false);

		if (role) {
			Object.assign(replyOptions, { role });

			if (role.id === interaction.guildId || role.managed) {
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["invalid_role"],
						replyOptions
					)
				);
				return;
			}

			const holders = await interaction.guild.members
				.fetch()
				.then((c) =>
					c.filter((m) => m.roles.cache.has(role.id)).map((m) => m.id)
				);

			getUserData(client).then((arr) =>
				arr
					.filter((d) => holders.some((id) => d.userId === id))
					.forEach(async (d) => {
						await d.updateOne({
							$set: {
								exp: 0
							}
						});
					})
			);
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["cleared_for_holders"],
					replyOptions
				)
			);
			return;
		}

		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["missing_args"],
				replyOptions
			)
		);
	}
};

export default command;
