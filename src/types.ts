import type { BufferView } from "./buffer";

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
  dataType: Data;
}

// biome-ignore lint/suspicious/noExplicitAny: any is required for extends
export type AnyMessageSerializer = MessageSerializer<any>;
