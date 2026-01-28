import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Channel,
	ComponentType,
	EmbedBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	PermissionFlagsBits,
	Role,
	SlashCommandBuilder,
	SlashCommandStringOption,
	SlashCommandSubcommandBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import { Command, LoggerProfile } from "../types";

export default {
	data: new SlashCommandBuilder()
		.setName("ascchannel")
		.setDescription("頻道訊息搬移設定")
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("create")
				.setDescription("建立設定檔")
				.addStringOption(
					new SlashCommandStringOption()
						.setName("profile")
						.setDescription("設定檔名稱")
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("edit")
				.setDescription("編輯設定檔")
				.addStringOption(
					new SlashCommandStringOption()
						.setName("profile")
						.setDescription("設定檔名稱")
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("delete")
				.setDescription("移除設定檔")
				.addStringOption(
					new SlashCommandStringOption()
						.setName("profile")
						.setDescription("設定檔名稱")
						.setRequired(true)
				)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	execute: async (client, interaction) => {
		if (interaction.user.id !== process.env["OWNER_ID"]) {
			return;
		}

		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();
		const profileName = interaction.options.getString("profile", true);
		const rawProfile = await client.db.get(`ascchannel_${profileName}`);

		if (subcommand !== "edit") {
			if (subcommand === "create" && rawProfile) {
				await interaction.editReply("設定檔已經存在。");
				return;
			}
			if (subcommand === "delete" && !rawProfile) {
				await interaction.editReply("設定檔不存在。");
				return;
			}
		} else if (!rawProfile) {
			await interaction.editReply("設定檔不存在。");
			return;
		}

		const profile: LoggerProfile = rawProfile
			? JSON.parse(rawProfile)
			: { name: profileName, listened_channels: [] };

		const setNotifRoleBtn = new ButtonBuilder()
			.setCustomId("logger_set_notif_role")
			.setLabel("設定通知身分組")
			.setStyle(ButtonStyle.Primary);
		const setLoggingChBtn = new ButtonBuilder()
			.setCustomId("logger_set_logging_ch")
			.setLabel("設定轉傳頻道")
			.setStyle(ButtonStyle.Primary);
		const addListenedChBtn = new ButtonBuilder()
			.setCustomId("logger_add_listened_ch")
			.setLabel("新增監聽頻道")
			.setStyle(ButtonStyle.Primary);
		const remListenedChBtn = new ButtonBuilder()
			.setCustomId("logger_rem_listened_ch")
			.setLabel("移除監聽頻道")
			.setStyle(ButtonStyle.Primary);
		const finishBtn = new ButtonBuilder()
			.setCustomId("logger_finish")
			.setLabel("完成變更")
			.setStyle(ButtonStyle.Success);

		const message = await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setDescription(
						`## 通知身分組
						${profile.notif_role ? `<@&${profile.notif_role}>` : "`N/A`"}\n## 轉傳頻道
						${profile.logging_channel ? `<#${profile.logging_channel}>` : "`N/A`"}\n## 監聽頻道
						${profile.listened_channels.length ? profile.listened_channels.map((id) => `<#${id}>`).join(", ") : "`N/A`"}`
					)
					.setColor("Fuchsia")
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					setNotifRoleBtn,
					setLoggingChBtn,
					addListenedChBtn,
					remListenedChBtn.setDisabled(!profile.listened_channels?.length),
					finishBtn
				)
			]
		});

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === interaction.user.id,
			idle: 300000,
			dispose: true
		});

		const modal = new ModalBuilder().addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("channel")
					.setLabel("頻道ID")
					.setPlaceholder("輸入頻道ID")
					.setStyle(TextInputStyle.Short)
					.setRequired(true)
			)
		);
		let modalRes: ModalSubmitInteraction | null;
		let channelId: string;
		let channel: Channel | null;
		let roleId: string;
		let role: Role | null | undefined;

		collector.on("collect", async (i) => {
			if (i.customId === "logger_finish") {
				collector.stop();
				await i.reply({
					content: "正在儲存變更...",
					ephemeral: true
				});
				return;
			}
			if (i.customId === "logger_set_notif_role") {
				await i.showModal(
					new ModalBuilder()
						.setCustomId(i.customId + "_modal_" + i.createdTimestamp)
						.setTitle(i.component.label!)
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("role")
									.setLabel("身分組ID")
									.setPlaceholder("輸入身分組ID")
									.setStyle(TextInputStyle.Short)
									.setRequired(true)
							)
						)
				);
			} else {
				modal.setCustomId(i.customId + "_modal_" + i.createdTimestamp);
				modal.setTitle(i.component.label!);

				await i.showModal(modal);
			}

			modalRes = await i
				.awaitModalSubmit({
					filter: (m) =>
						m.user.id === interaction.user.id &&
						m.customId.startsWith(i.customId) &&
						m.customId.endsWith(`${i.createdTimestamp}`),
					time: 120000,
					dispose: true
				})
				.catch(() => null);

			if (!modalRes) {
				return;
			}

			await modalRes.deferUpdate();

			if (i.customId === "logger_set_notif_role") {
				roleId = modalRes.fields.getTextInputValue("role");
			} else {
				channelId = modalRes.fields.getTextInputValue("channel");
			}

			switch (i.customId) {
				case "logger_set_notif_role":
					role = await interaction.guild?.roles
						.fetch(roleId, { cache: false })
						.catch(() => null);

					if (!role || role.managed) {
						break;
					}

					profile.notif_role = roleId;
					break;
				case "logger_set_logging_ch":
					if (profile.listened_channels.includes(channelId)) {
						break;
					}

					channel = await client.channels
						.fetch(channelId)
						.then((ch) => (ch?.isTextBased() ? ch : null))
						.catch(() => null);

					if (!channel) {
						break;
					}

					profile.logging_channel = channelId;
					break;
				case "logger_add_listened_ch":
					if (channelId === profile.logging_channel) {
						break;
					}

					channel = await client.channels
						.fetch(channelId, { cache: false })
						.then((ch) => (ch?.isTextBased() ? ch : null))
						.catch(() => null);

					if (!channel) {
						break;
					}

					profile.listened_channels.push(channelId);
					break;
				case "logger_rem_listened_ch":
					if (!profile.listened_channels.includes(channelId)) {
						break;
					}

					profile.listened_channels.splice(
						profile.listened_channels.findIndex((id) => id === channelId),
						1
					);
					break;
			}

			await modalRes.editReply({
				embeds: [
					new EmbedBuilder()
						.setDescription(
							`## 通知身分組
							${profile.notif_role ? `<@&${profile.notif_role}>` : "`N/A`"}\n## 轉傳頻道
							${profile.logging_channel ? `<#${profile.logging_channel}>` : "`N/A`"}\n## 監聽頻道
							${profile.listened_channels.length ? profile.listened_channels.map((id) => `<#${id}>`).join(", ") : "`N/A`"}`
						)
						.setColor("Fuchsia")
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						setNotifRoleBtn,
						setLoggingChBtn,
						addListenedChBtn,
						remListenedChBtn.setDisabled(!profile.listened_channels.length),
						finishBtn
					)
				]
			});
		});
		collector.on("end", async () => {
			const nProfile = JSON.stringify(profile);

			if (nProfile !== rawProfile) {
				await client.db.set(`ascchannel_${profileName}`, nProfile);
			}

			await interaction.editReply({
				content: "## 已儲存變更",
				components: []
			});
		});
	}
} as Command;
