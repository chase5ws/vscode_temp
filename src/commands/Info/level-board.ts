import { SlashCommandBuilder } from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { requiredExp } from "../../utils/levelingUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("level-board")
		.setDescription("查看聊天等級排行榜")
		.setDMPermission(false),
	defer: true,
	leveling: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const data = (await getUserData(client))
			.filter((d) => d.level || d.exp)
			.sort((a, b) =>
				(a.level ?? 0) === (b.level ?? 0)
					? b.exp! - a.exp!
					: (b.level ?? 0) - (a.level ?? 0)
			);

		const msgData = {} as ReturnType<typeof resolveReply>;

		Object.assign(replyOptions, {
			guild: interaction.guild
		});
		Object.assign(
			msgData,
			resolveReply(
				client.messages[interaction.commandName]["leaderboard"],
				replyOptions
			)
		);

		while ((msgData.embeds![0].data.fields?.length ?? 0) < 10) {
			const memberData = data.shift();

			if (!memberData) {
				break;
			}

			const member = await interaction.guild.members
				.fetch(memberData.userId)
				.catch(() => null);

			if (!member) {
				continue;
			}

			Object.assign(replyOptions, {
				index: (msgData.embeds![0].data.fields?.length ?? 0) + 1,
				user: member.user,
				exp: (memberData.exp ?? 0).toLocaleString(),
				level: (memberData.level ?? 0).toLocaleString(),
				reqExp: requiredExp((memberData.level ?? 0) + 1)
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

		if (!msgData.embeds?.[0].data.fields?.length) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["empty"],
					replyOptions
				)
			);
			return;
		}

		await interaction.editReply(msgData);
	}
};

export default command;
