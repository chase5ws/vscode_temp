import { resolveReply } from "../utils/botUtils.js";
import { getUserData } from "../utils/mognoUtils.js";
import { tableDataDb } from "../mongoose/tableData.js";

export async function handleButtons(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ButtonInteraction<"cached">
) {
	if (!interaction.customId.startsWith("table-option")) {
		return;
	}

	await interaction.deferReply({
		ephemeral: true
	});

	const replyOptions = {};
	const tableData = await tableDataDb.findOne({
		messageId: interaction.message.id
	});

	Object.assign(replyOptions, {
		user: interaction.user
	});

	if (!tableData || tableData.endTime * 1000 < Date.now()) {
		await interaction.editReply(
			resolveReply(client.messages["table"]["expired"], replyOptions)
		);
		return;
	}
	if (tableData.choices.has(interaction.user.id)) {
		await interaction.editReply(
			resolveReply(client.messages["table"]["alr_chosen"], replyOptions)
		);
		return;
	}

	const userData = await getUserData(client, interaction.user.id);

	if (userData.coins < tableData.cost) {
		await interaction.editReply(
			resolveReply(client.messages["table"]["too_poor"], replyOptions)
		);
		return;
	}

	const choice = parseInt(interaction.customId.slice(13));

	Object.assign(replyOptions, {
		id: interaction.message.id,
		choice
	});

	await tableData.updateOne({
		$set: {
			[`choices.${interaction.user.id}`]: choice
		}
	});
	await userData.updateOne({
		$inc: {
			coins: -tableData.cost
		}
	});
	await interaction.editReply(
		resolveReply(client.messages["table"]["chose"], replyOptions)
	);
	await interaction.user.send(
		resolveReply(client.messages["table"]["dm"], replyOptions)
	);
}
