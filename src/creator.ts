import {
  BufferView,
  calculateMessageFrameSize,
  createMessageFrame,
} from "./index";

export const FrameFieldTypes = {
  BigInt: 1,
  Number: 2,
  String: 3,
  Boolean: 4,
} as const;

export type MessageFrameFields = Record<
  string,
  (typeof FrameFieldTypes)[keyof typeof FrameFieldTypes]
>;

type InferFieldsType<Fields extends MessageFrameFields> = {
  [K in keyof Fields]: Fields[K] extends typeof FrameFieldTypes.BigInt
    ? bigint
    : Fields[K] extends typeof FrameFieldTypes.Number
      ? number
      : Fields[K] extends typeof FrameFieldTypes.String
        ? string
        : Fields[K] extends typeof FrameFieldTypes.Boolean
          ? boolean
          : never;
};

export function createMessageFrameFromStructure<
  Fields extends MessageFrameFields,
>(fields: Fields) {
  const Frame = createMessageFrame<InferFieldsType<Fields>>({
    serialize(data) {
      const size = calculateMessageFrameSize(data);
      const buffer = new ArrayBuffer(size);

      const view = BufferView.create(buffer);

      for (const [key, fieldType] of Object.entries(fields)) {
        serializeField(view, fieldType, key, data[key]);
      }

      return view;
    },
    deserialize(buffer) {
      const entries = Object.entries(fields).map(([key, value]) => {
        switch (value) {
          case FrameFieldTypes.BigInt:
            return [key, buffer.getUint64()] as const;
          case FrameFieldTypes.Number:
            return [key, buffer.getUint32()] as const;
          case FrameFieldTypes.String:
            return [key, buffer.getString()] as const;
          case FrameFieldTypes.Boolean:
            return [key, buffer.getBoolean()] as const;
          default:
            value satisfies never;
            throw new Error(`Unhandled field type: ${value}`);
        }
      });

      return Object.fromEntries(entries);
    },
  });

  return Frame;
}

function serializeField(
  view: BufferView,
  fieldType: (typeof FrameFieldTypes)[keyof typeof FrameFieldTypes],
  key: string,
  value: unknown,
) {
  switch (fieldType) {
    case FrameFieldTypes.BigInt:
      if (typeof value !== "bigint")
        throw new Error(`Invalid data type for bigint: ${key}`);

      view.writeUint64(value);
      break;
    case FrameFieldTypes.Number:
      if (typeof value !== "number")
        throw new Error(`Invalid data type for number: ${key}`);

      view.writeUint32(value);
      break;
    case FrameFieldTypes.String: {
      if (typeof value !== "string")
        throw new Error(`Invalid data type for string: ${key}`);

      const encoder = new TextEncoder();

      view.writeBytes(encoder.encode(value));
      break;
    }
    case FrameFieldTypes.Boolean:
      if (typeof value !== "boolean")
        throw new Error(`Invalid data type for boolean: ${key}`);

      view.writeBoolean(value);
      break;
    default:
      fieldType satisfies never;
      throw new Error(`Unhandled field type: ${fieldType}`);
  }
}
