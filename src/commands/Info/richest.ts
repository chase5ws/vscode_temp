import { SlashCommandBuilder } from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("richest")
		.setDescription("取得忍者村最有錢的前十名")
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		const data = (await getUserData(client))
			.filter((d) => d.coins)
			.sort((a, b) => b.coins - a.coins)
			.slice(0, 10);

		if (!data.length) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["empty"],
					replyOptions
				)
			);
			return;
		}

		const msgData = {} as ReturnType<typeof resolveReply>;

		Object.assign(replyOptions, {
			amount: data.reduce((acc, cur) => acc + cur.coins, 0).toLocaleString(),
			guild: interaction.guild
		});
		Object.assign(
			msgData,
			resolveReply(
				client.messages[interaction.commandName]["leaderboard"],
				replyOptions
			)
		);

		for (let i = 0; i < data.length; i++) {
			Object.assign(replyOptions, {
				index:
					i === 0
						? client.messages[interaction.commandName]["medals"]["first"]
						: i === 1
						? client.messages[interaction.commandName]["medals"]["second"]
						: i === 2
						? client.messages[interaction.commandName]["medals"]["third"]
						: i + 1,
				user: (await interaction.guild.members.fetch(data[i].userId)).user,
				amount: data[i].coins.toLocaleString()
			});
			msgData["embeds"]![0].addFields({
				name: resolveReply(
					client.messages[interaction.commandName]["field_format"]["name"],
					replyOptions
				).content!,
				value: resolveReply(
					client.messages[interaction.commandName]["field_format"]["value"],
					replyOptions
				).content!
			});
		}

		await interaction.editReply(msgData);
	}
};

export default command;
