import {
	AttachmentBuilder,
	ChannelType,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandChannelOption,
	SlashCommandRoleOption,
	SlashCommandSubcommandBuilder,
	SlashCommandUserOption
} from "discord.js";
import { CaptchaGenerator } from "captcha-canvas";
import { Command } from "../types";

export default {
	data: new SlashCommandBuilder()
		.setName("asccheck")
		.setDescription("使用者驗證")
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("verify")
				.setDescription("驗證使用者")
				.addUserOption(
					new SlashCommandUserOption()
						.setName("user")
						.setDescription("使用者")
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("fail")
				.setDescription("身分組設定")
				.addRoleOption(
					new SlashCommandRoleOption()
						.setName("role")
						.setDescription("身分組")
						.setRequired(false)
				)
				.addChannelOption(
					new SlashCommandChannelOption()
						.setName("channel")
						.setDescription("語音頻道")
						.addChannelTypes(ChannelType.GuildVoice)
						.setRequired(false)
				)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	execute: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		const subCommand = interaction.options.getSubcommand(true);

		if (subCommand === "fail") {
			const role = interaction.options.getRole("role");
			const channel = interaction.options.getChannel("channel", false, [
				ChannelType.GuildVoice
			]);

			if (!role && !channel) {
				await interaction.editReply("請輸入設定選項。");
				return;
			}
			if (role) {
				if (role.managed) {
					await interaction.editReply("不能是機器人身分組。");
					return;
				}

				await client.db.set("asccheck_role", role.id);
			}
			if (channel) {
				await client.db.set("asccheck_channel", channel.id);
			}

			await interaction.editReply(
				`已完成設定。${role ? `\n身分組: <@&${role.id}>` : ""}${channel ? `\n語音頻道: <#${channel.id}>` : ""}`
			);
			return;
		}

		const role = await client.db.get("asccheck_role");
		const channel = await client.db.get("asccheck_channel");

		if (!role || !channel) {
			await interaction.editReply("尚未設定完成。");
			return;
		}

		const user = interaction.options.getUser("user", true);

		if (user.bot) {
			await interaction.editReply("無法對機器人進行驗證。");
			return;
		}

		const captcha = new CaptchaGenerator({
			height: 200,
			width: 600
		});
		const buffer = await captcha.generate();

		const message = await interaction.channel!.send({
			content: `${user}`,
			embeds: [
				new EmbedBuilder()
					.setTitle("輸入圖片中的文字進行驗證。")
					.setImage("attachment://captcha.png")
					.setColor("Random")
			],
			files: [new AttachmentBuilder(buffer).setName("captcha.png")]
		});

		await interaction.editReply("已傳送驗證訊息。");

		const input = await message.channel
			.awaitMessages({
				filter: (m) => m.author.id === user.id,
				max: 1,
				time: 300000,
				dispose: true
			})
			.then((c) => c.first()?.content)
			.catch(() => null);

		if (!input || input !== captcha.text) {
			await message.reply({
				embeds: [new EmbedBuilder().setTitle("驗證失敗。").setColor("DarkRed")]
			});

			const member = await interaction.guild!.members.fetch(user);

			await member.roles.add(role);

			await member.voice.setChannel(channel).catch(() => {});
			return;
		}

		await message.reply({
			embeds: [new EmbedBuilder().setTitle("驗證成功。").setColor("Aqua")]
		});
	}
} as Command;
