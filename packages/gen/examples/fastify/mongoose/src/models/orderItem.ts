import { type Connection, type InferSchemaType, type Model, Schema, type Types } from 'mongoose';

const ORDER_ITEM_MODEL = 'OrderItem';

const orderItemDbSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

orderItemDbSchema.index({ ownerId: 1, createdAt: -1 });

type TOrderItemDoc = InferSchemaType<typeof orderItemDbSchema> & { _id: Types.ObjectId };
type TOrderItemModel = Model<TOrderItemDoc>;

const getOrderItemModel = (db: Connection): TOrderItemModel =>
  Object.hasOwn(db.models, ORDER_ITEM_MODEL)
    ? db.model<TOrderItemDoc>(ORDER_ITEM_MODEL)
    : db.model<TOrderItemDoc>(ORDER_ITEM_MODEL, orderItemDbSchema);

export { ORDER_ITEM_MODEL, getOrderItemModel };
export type { TOrderItemDoc, TOrderItemModel };
