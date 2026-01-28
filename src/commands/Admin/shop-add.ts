import {
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
	SlashCommandNumberOption
} from "discord.js";
import { productDataDb } from "../../mongoose/productData.js";
import { resolveReply } from "../../utils/botUtils.js";
import { getProductData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("shop-add")
		.setDescription("管理員指令：新增商品至忍者村商店")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("type")
				.setDescription("商品類型")
				.addChoices(
					{
						name: "提⾼賭注上限",
						value: 0
					},
					{
						name: "⼯作獎勵加倍",
						value: 1
					},
					{
						name: "遊戲冷卻重置",
						value: 2
					},
					{
						name: "保護符",
						value: 3
					},
					{
						name: "復活卷",
						value: 4
					},
					{
						name: "無效果",
						value: 5
					}
				)
				.setRequired(true)
		)
		.addStringOption(
			new SlashCommandStringOption()
				.setName("name")
				.setDescription("商品名稱")
				.setMaxLength(50)
				.setRequired(true)
		)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("price")
				.setDescription("商品價格")
				.setMinValue(1)
				.setRequired(true)
		)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("duration")
				.setDescription("持續時間(小時)")
				.setMinValue(1)
				.setRequired(false)
		)
		.addNumberOption(
			new SlashCommandNumberOption()
				.setName("multiplier")
				.setDescription("提升倍數")
				.setMinValue(0)
				.setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const type = interaction.options.getInteger("type", true);
		const data = {
			guildId: client.config.guildId,
			itemType: type
		};

		switch (type) {
			case 0:
			case 1: {
				const multiplier = interaction.options.getNumber("multiplier", false);

				if (!multiplier) {
					await interaction.editReply(
						resolveReply(
							client.messages[interaction.commandName]["invalid_mul"],
							replyOptions
						)
					);
					break;
				}

				const duration = interaction.options.getInteger("duration", false);

				if (!duration) {
					await interaction.editReply(
						resolveReply(
							client.messages[interaction.commandName]["invalid_duration"],
							replyOptions
						)
					);
					break;
				}

				const product = await getProductData(client, {
					multiplier,
					duration,
					...data
				});

				if (product) {
					await interaction.editReply(
						resolveReply(
							client.messages[interaction.commandName]["alr_exists"],
							replyOptions
						)
					);
					break;
				}

				const name = interaction.options.getString("name", true);
				const price = interaction.options.getInteger("price", true);

				Object.assign(replyOptions, { name, price, multiplier, duration });
				await productDataDb.create({
					name,
					price,
					multiplier,
					duration,
					...data
				});
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["added"],
						replyOptions
					)
				);
				break;
			}
			case 2:
			case 3:
			case 4:
			case 5: {
				const product = await getProductData(client, data);

				if (product) {
					await interaction.editReply(
						resolveReply(
							client.messages[interaction.commandName]["alr_exists"],
							replyOptions
						)
					);
					break;
				}

				const name = interaction.options.getString("name", true);
				const price = interaction.options.getInteger("price", true);

				Object.assign(replyOptions, { name, price });
				await productDataDb.create({ name, price, ...data });
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["added"],
						replyOptions
					)
				);
				break;
			}
		}
	}
};

export default command;
