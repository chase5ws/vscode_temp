import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption,
	SlashCommandRoleOption
} from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";
import { calcExpAndLevels } from "../../utils/levelingUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("add-exp")
		.setDescription("新增經驗")
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

			const amount = interaction.options.getInteger("amount", true);

			Object.assign(replyOptions, {
				amount: amount.toLocaleString()
			});
			getUserData(client, target.id).then(async (d) => {
				await d.updateOne({
					$set: {
						...calcExpAndLevels(
							{
								exp: d.exp ?? 0,
								level: d.level ?? 0
							},
							amount
						)
					}
				});
			});
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["added_to_target"],
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
				.then((c) => c.filter((m) => m.roles.cache.has(role.id)).map((m) => m));

			Object.assign(replyOptions, {
				amount: amount.toLocaleString()
			});

			for (const holder of holders) {
				getUserData(client, holder.id).then(async (d) => {
					await d.updateOne({
						$set: {
							...calcExpAndLevels(
								{
									exp: d.exp ?? 0,
									level: d.level ?? 0
								},
								amount
							)
						}
					});
				});
			}

			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["added_to_holders"],
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
