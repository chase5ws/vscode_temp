import { SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("place")
		.setDescription("取得自己在忍者村的經濟排名")
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

		if (target.bot) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_bot"],
					replyOptions
				)
			);
			return;
		}

		const data = (await getUserData(client))
			.filter((d) => d.coins)
			.sort((a, b) => b.coins - a.coins);

		if (!data.length) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["no_ranking_server"],
					replyOptions
				)
			);
			return;
		}
		if (!data.some((d) => d.userId === target.id)) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["no_ranking_person"],
					replyOptions
				)
			);
			return;
		}

		Object.assign(replyOptions, {
			index: data.findIndex((d) => d.userId === target.id) + 1
		});
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["ranking"],
				replyOptions
			)
		);
	}
};

export default command;
