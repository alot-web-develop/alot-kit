import { type Connection, type InferSchemaType, type Model, Schema, type Types } from 'mongoose';

const CUSTOMER_MODEL = 'Customer';

const customerDbSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

customerDbSchema.index({ ownerId: 1, createdAt: -1 });

type TCustomerDoc = InferSchemaType<typeof customerDbSchema> & { _id: Types.ObjectId };
type TCustomerModel = Model<TCustomerDoc>;

const getCustomerModel = (db: Connection): TCustomerModel =>
  Object.hasOwn(db.models, CUSTOMER_MODEL)
    ? db.model<TCustomerDoc>(CUSTOMER_MODEL)
    : db.model<TCustomerDoc>(CUSTOMER_MODEL, customerDbSchema);

export { CUSTOMER_MODEL, getCustomerModel };
export type { TCustomerDoc, TCustomerModel };
