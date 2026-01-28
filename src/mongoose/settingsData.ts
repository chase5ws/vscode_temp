import { Document, Schema, SchemaTypes, Types, model } from "mongoose";

interface Settings {
	guildId: string;
	krSwitch: boolean;
}

export const settingsDataDb = model(
	"settings",
	new Schema<Settings>({
		guildId: {
			type: SchemaTypes.String,
			required: true
		},
		krSwitch: {
			type: SchemaTypes.Boolean,
			default: true,
			required: true
		}
	})
);

export type SettingsDataDoc = Document<unknown, any, Settings> &
	Settings & {
		_id: Types.ObjectId;
	};
