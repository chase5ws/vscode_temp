import {
	SlashCommandBuilder,
	SlashCommandUserOption,
	SlashCommandIntegerOption
} from "discord.js";
import { getUserData } from "../../utils/mognoUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("give-coins")
		.setDescription("轉帳指令：從自己的錢包轉帳忍幣至他人錢包")
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
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		const target = interaction.options.getUser("member", true);

		Object.assign(replyOptions, {
			user: interaction.user,
			target
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
		if (target.id === interaction.user.id) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["is_themself"],
					replyOptions
				)
			);
			return;
		}

		const amount = interaction.options.getInteger("amount", true);
		const userData = await getUserData(client, interaction.user.id);

		Object.assign(replyOptions, { amount });

		if (amount > userData.coins) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["amount_too_large"],
					replyOptions
				)
			);
			return;
		}

		const targetData = await getUserData(client, target.id);

		const tUpdatePromise = targetData.updateOne({
			$inc: {
				coins: amount
			}
		});
		const uUpdatePromise = userData.updateOne({
			$inc: {
				coins: -amount
			}
		});

		Object.assign(replyOptions, {
			coins: (userData.coins - amount).toLocaleString()
		});
		await tUpdatePromise;
		await uUpdatePromise;
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["transfered"],
				replyOptions
			)
		);
	}
};

export default command;
