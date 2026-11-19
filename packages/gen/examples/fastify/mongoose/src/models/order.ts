import { type Connection, type InferSchemaType, type Model, Schema, type Types } from 'mongoose';

const ORDER_MODEL = 'Order';

const orderDbSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

orderDbSchema.index({ ownerId: 1, createdAt: -1 });

type TOrderDoc = InferSchemaType<typeof orderDbSchema> & { _id: Types.ObjectId };
type TOrderModel = Model<TOrderDoc>;

const getOrderModel = (db: Connection): TOrderModel =>
  Object.hasOwn(db.models, ORDER_MODEL)
    ? db.model<TOrderDoc>(ORDER_MODEL)
    : db.model<TOrderDoc>(ORDER_MODEL, orderDbSchema);

export { ORDER_MODEL, getOrderModel };
export type { TOrderDoc, TOrderModel };
