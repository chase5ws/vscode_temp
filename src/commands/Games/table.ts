import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandChannelOption,
	SlashCommandStringOption
} from "discord.js";
import {
	handleTableCreate,
	handleTableShow,
	handleTableStart
} from "../../utils/tableUtils.js";
import { resolveReply } from "../../utils/botUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("table")
		.setDescription("賭盤指令")
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("create")
				.setDescription("建立賭盤")
				.addChannelOption(
					new SlashCommandChannelOption()
						.setName("channel")
						.setDescription("發布頻道")
						.addChannelTypes(0) // GuildText
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("start")
				.setDescription("啟動賭盤")
				.addStringOption(
					new SlashCommandStringOption()
						.setName("id")
						.setDescription("賭盤ID")
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("show")
				.setDescription("顯示賭盤結果")
				.addStringOption(
					new SlashCommandStringOption()
						.setName("id")
						.setDescription("賭盤ID")
						.setRequired(true)
				)
		)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		if (
			!interaction.member.permissions.has("Administrator") &&
			!interaction.member.roles.cache.has(client.config.roles.table_host)
		) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["no_perm"],
					replyOptions
				)
			);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case "create":
				handleTableCreate(client, interaction, replyOptions);
				break;
			case "start":
				handleTableStart(client, interaction, replyOptions);
				break;
			case "show":
				handleTableShow(client, interaction, replyOptions);
				break;
		}
	}
};

export default command;
