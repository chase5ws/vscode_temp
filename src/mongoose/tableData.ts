import { Document, model, Schema, SchemaTypes, Types } from "mongoose";

interface TableData {
	channelId: string;
	messageId: string;
	cost: number;
	prize: number;
	started: boolean;
	endTime: number;
	choices: Map<string, 0 | 1>;
}

export const tableDataDb = model(
	"tables",
	new Schema<TableData>({
		channelId: {
			type: SchemaTypes.String,
			required: true
		},
		messageId: {
			type: SchemaTypes.String,
			required: true
		},
		cost: {
			type: SchemaTypes.Number,
			required: true
		},
		prize: {
			type: SchemaTypes.Number,
			required: true
		},
		started: {
			type: SchemaTypes.Boolean,
			required: true,
			default: false
		},
		endTime: {
			type: SchemaTypes.Number,
			required: true
		},
		choices: {
			type: SchemaTypes.Map,
			required: true,
			of: SchemaTypes.Number,
			default: new Map()
		}
	})
);

export type TableDataDoc = Document<unknown, any, TableData> &
	TableData & {
		_id: Types.ObjectId;
	};
