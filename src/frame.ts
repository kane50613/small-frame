import { BufferView } from "./buffer";
import type { MessageSerializer, MessageSerializerParams } from "./types";

export function createMessageSerializer<Data>(
  params: MessageSerializerParams<Data>,
) {
  return {
    serialize(data: Data) {
      return params.serialize(data).toTypedArray();
    },
    deserialize(buffer) {
      let view: BufferView;

      if (buffer instanceof BufferView) {
        // Reset the existing view to start from the beginning
        view = buffer.reset();
      } else {
        // Create a new view from the ArrayBuffer
        view = BufferView.create(buffer);
      }

      const result = params.deserialize(view);

      if (!view.isFinished)
        throw new Error("Buffer is not finished, length mismatch");

      return result;
    },
  } as MessageSerializer<Data>;
}
