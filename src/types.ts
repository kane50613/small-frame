import type { BufferView } from "./buffer";
import type { FieldType } from "./creator";

export interface MessageSerializerParams<Data> {
  serialize(data: Data): BufferView;
  deserialize(buffer: BufferView): Data;
  view?: BufferView;
}

export interface MessageSerializer<Data> {
  serialize(data: Data): Uint8Array;
  deserialize(
    buffer: BufferView | ArrayBuffer | ArrayBufferView | Uint8Array,
  ): Data;
  $type: Data;
}

// biome-ignore lint/suspicious/noExplicitAny: any is required for extends
export type AnyMessageSerializer = MessageSerializer<any>;

export type FieldDefinitions = Record<
  string,
  (typeof FieldType)[keyof typeof FieldType]
>;

export type InferFieldTypes<Fields extends FieldDefinitions> = {
  [K in keyof Fields]: Fields[K] extends typeof FieldType.BigInt
    ? bigint
    : Fields[K] extends typeof FieldType.Number
      ? number
      : Fields[K] extends typeof FieldType.String
        ? string
        : Fields[K] extends typeof FieldType.Boolean
          ? boolean
          : never;
};
