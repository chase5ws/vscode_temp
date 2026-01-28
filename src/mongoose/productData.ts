import { Document, model, Schema, SchemaTypes, Types } from "mongoose";

interface Product {
	guildId: string;
	name: string;
	price: number;
	itemType: number;
	duration?: number;
	multiplier?: number;
}

export const productDataDb = model(
	"products",
	new Schema<Product>({
		guildId: {
			type: SchemaTypes.String,
			required: true
		},
		name: {
			type: SchemaTypes.String,
			required: true
		},
		price: {
			type: SchemaTypes.Number,
			required: true
		},
		itemType: {
			type: SchemaTypes.Number,
			required: true
		},
		duration: {
			type: SchemaTypes.Number,
			required: false
		},
		multiplier: {
			type: SchemaTypes.Number,
			required: false
		}
	})
);

export type ProductDataDoc = Document<unknown, any, Product> &
	Product & {
		_id: Types.ObjectId;
	};
