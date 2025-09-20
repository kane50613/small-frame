import { BufferView } from "./buffer";
import { createMessageSerializer } from "./frame";
import type { FieldDefinitions, InferFieldTypes } from "./types";
import { calculateSerializedSize } from "./utils";

export const FieldType = {
  BigInt: 1,
  Number: 2,
  String: 3,
  Boolean: 4,
} as const;

export function createFrameFromFields<Fields extends FieldDefinitions>(
  fieldDefinitions: Fields,
) {
  return createMessageSerializer<InferFieldTypes<Fields>>({
    serialize(data) {
      const size = calculateSerializedSize(data);
      const buffer = new ArrayBuffer(size);

      const view = BufferView.create(buffer);

      for (const [fieldName, fieldType] of Object.entries(fieldDefinitions)) {
        serializeFieldValue(view, fieldType, fieldName, data[fieldName]);
      }

      return view;
    },
    deserialize(buffer) {
      const fieldEntries = Object.entries(fieldDefinitions).map(
        ([fieldName, fieldType]) => {
          switch (fieldType) {
            case FieldType.BigInt:
              return [fieldName, buffer.readUint64()] as const;
            case FieldType.Number:
              return [fieldName, buffer.readUint32()] as const;
            case FieldType.String:
              return [fieldName, buffer.readString()] as const;
            case FieldType.Boolean:
              return [fieldName, buffer.readBoolean()] as const;
            default:
              fieldType satisfies never;
              throw new Error(`Unhandled field type: ${fieldType}`);
          }
        },
      );

      return Object.fromEntries(fieldEntries);
    },
  });
}

function serializeFieldValue(
  view: BufferView,
  fieldType: (typeof FieldType)[keyof typeof FieldType],
  fieldName: string,
  fieldValue: unknown,
) {
  switch (fieldType) {
    case FieldType.BigInt:
      if (typeof fieldValue !== "bigint")
        throw new Error(`Invalid data type for bigint: ${fieldName}`);

      view.writeUint64(fieldValue);
      break;
    case FieldType.Number:
      if (typeof fieldValue !== "number")
        throw new Error(`Invalid data type for number: ${fieldName}`);

      view.writeUint32(fieldValue);
      break;
    case FieldType.String: {
      if (typeof fieldValue !== "string")
        throw new Error(`Invalid data type for string: ${fieldName}`);

      const encoder = new TextEncoder();

      view.writeBytes(encoder.encode(fieldValue));
      break;
    }
    case FieldType.Boolean:
      if (typeof fieldValue !== "boolean")
        throw new Error(`Invalid data type for boolean: ${fieldName}`);

      view.writeBoolean(fieldValue);
      break;
    default:
      fieldType satisfies never;
      throw new Error(`Unhandled field type: ${fieldType}`);
  }
}
