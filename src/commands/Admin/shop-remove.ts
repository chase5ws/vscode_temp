import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption
} from "discord.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getProductData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("shop-remove")
		.setDescription("移除商店中的商品")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("index")
				.setDescription("商品編號")
				.setMinValue(1)
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const products = await getProductData(client);
		const index = interaction.options.getInteger("index", true);

		Object.assign(replyOptions, { index });

		if (index > products.length) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["invalid_index"],
					replyOptions
				)
			);
			return;
		}

		await products[index - 1].deleteOne();
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["removed"],
				replyOptions
			)
		);
	}
};

export default command;
