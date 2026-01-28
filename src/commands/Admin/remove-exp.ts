import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandRoleOption,
	SlashCommandUserOption
} from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("remove-exp")
		.setDescription("移除經驗")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("amount")
				.setDescription("經驗數")
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

			const userData = await getUserData(client, target.id);
			const amount = interaction.options.getInteger("amount", true);

			Object.assign(replyOptions, {
				amount: amount.toLocaleString()
			});

			if ((userData.exp ?? 0) < amount) {
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["amount_too_large"],
						replyOptions
					)
				);
				return;
			}

			await userData.updateOne({
				$inc: {
					exp: -amount
				}
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["removed_for_target"],
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

			const amount = interaction.options.getInteger("amount", true);
			const holders = await interaction.guild.members
				.fetch()
				.then((c) =>
					c.filter((m) => m.roles.cache.has(role.id)).map((m) => m.id)
				);

			Object.assign(replyOptions, {
				amount: amount.toLocaleString()
			});
			getUserData(client).then((arr) =>
				arr
					.filter((d) => holders.some((id) => d.userId === id))
					.forEach(async (d) => {
						await d.updateOne({
							$inc: {
								exp: (d.exp ?? 0) < amount ? -(d.exp ?? 0) : -amount
							}
						});
					})
			);
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["removed_for_holders"],
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
