import { type Connection, type InferSchemaType, type Model, Schema, type Types } from 'mongoose';

const __NAME___MODEL = '__Name__';

const __name__DbSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

__name__DbSchema.index({ ownerId: 1, createdAt: -1 });

type T__Name__Doc = InferSchemaType<typeof __name__DbSchema> & { _id: Types.ObjectId };
type T__Name__Model = Model<T__Name__Doc>;

const get__Name__Model = (db: Connection): T__Name__Model =>
  Object.hasOwn(db.models, __NAME___MODEL)
    ? db.model<T__Name__Doc>(__NAME___MODEL)
    : db.model<T__Name__Doc>(__NAME___MODEL, __name__DbSchema);

export { __NAME___MODEL, get__Name__Model };
export type { T__Name__Doc, T__Name__Model };
