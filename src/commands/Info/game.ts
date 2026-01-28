import { readFileSync } from "fs";
import { SlashCommandBuilder } from "discord.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("game")
		.setDescription("查詢指令詳細內容")
		.setDMPermission(false),
	defer: true,
	ephemeral: true,
	run: async (_, interaction) => {
		const content = readFileSync("./config/game.txt", {
			encoding: "utf8"
		});

		await interaction.editReply(content);
	}
};

export default command;
