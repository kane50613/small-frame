interface CreateMessageFrameParams<Data, View extends BufferView> {
  serialize(data: Data): View;
  deserialize(buffer: View): Data;
  createView?(buffer: ArrayBuffer): View;
}

export interface MessageFrame<Data, View extends BufferView> {
  serialize(data: Data): View;
  deserialize(buffer: View | ArrayBuffer): Data;
  $type: Data;
}

// biome-ignore lint/suspicious/noExplicitAny: any is required for extends
export type AnyMessageFrame = MessageFrame<any, BufferView>;

export function createMessageFrame<Data, View extends BufferView = BufferView>(
  params: CreateMessageFrameParams<Data, View>,
) {
  return {
    serialize: params.serialize,
    deserialize(buffer) {
      const createView = params.createView ?? BufferView.create;
      const view = buffer instanceof BufferView ? buffer : createView(buffer);

      const result = params.deserialize(view as View);

      if (!view.isFinished)
        throw new Error("Buffer is not finished, length mismatch");

      return result;
    },
  } as MessageFrame<Data, View>;
}

export function calculateMessageFrameSize(data: NonNullable<unknown>): number {
  switch (typeof data) {
    case "bigint":
      return BigUint64Array.BYTES_PER_ELEMENT;
    case "number":
      if (data < 0 || data > Number.MAX_SAFE_INTEGER)
        throw new Error("Number is out of range");

      return Uint32Array.BYTES_PER_ELEMENT;
    case "string":
      // string length + string bytes
      return new Blob([data]).size + Uint8Array.BYTES_PER_ELEMENT;
    case "boolean":
      return Uint8Array.BYTES_PER_ELEMENT;
    case "object": {
      if (Array.isArray(data)) {
        if (!data[0]) return 0;

        return data.length * calculateMessageFrameSize(data[0]);
      }

      return Object.values(data).reduce(
        (acc, value) => acc + calculateMessageFrameSize(value),
        0,
      );
    }
    default:
      throw new Error("Invalid data type");
  }
}

export class BufferView {
  private view: DataView;
  private buffer: ArrayBuffer;

  private offset = 0;

  private constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.buffer = buffer;
  }

  static create(buffer: ArrayBuffer) {
    return new BufferView(buffer);
  }

  getString(decoder = new TextDecoder()) {
    return decoder.decode(this.getBytes());
  }

  getBytes() {
    const length = this.getUint8();

    if (length === 0) return new ArrayBuffer(0);

    const sliced = this.buffer.slice(this.offset, this.offset + length);

    if (sliced.byteLength !== length)
      throw new Error(
        `string length field mismatch, expected ${length}, got ${sliced.byteLength}`,
      );

    this.offset += length;

    return sliced;
  }

  writeString(string: string) {
    return this.writeBytes(new TextEncoder().encode(string));
  }

  writeBytes(bytes: Uint8Array) {
    if (bytes.byteLength > 255) {
      throw new Error(
        `Bytes are too long, max length is 255, got ${bytes.byteLength}`,
      );
    }

    this.writeUint8(bytes.byteLength);

    for (const byte of bytes) {
      this.writeUint8(byte);
    }

    return this;
  }

  getUint32() {
    const value = this.view.getUint32(this.offset);

    this.offset += Uint32Array.BYTES_PER_ELEMENT;

    return value;
  }

  writeUint32(value: number) {
    this.view.setUint32(this.offset, value);

    this.offset += Uint32Array.BYTES_PER_ELEMENT;

    return this;
  }

  getUint8() {
    const value = this.view.getUint8(this.offset);

    this.offset += Uint8Array.BYTES_PER_ELEMENT;

    return value;
  }

  getUint64() {
    const value = this.view.getBigUint64(this.offset);

    this.offset += BigUint64Array.BYTES_PER_ELEMENT;

    return value;
  }

  getUint16() {
    const value = this.view.getUint16(this.offset);

    this.offset += Uint16Array.BYTES_PER_ELEMENT;

    return value;
  }

  writeUint8(value: number) {
    this.view.setUint8(this.offset, value);

    this.offset += Uint8Array.BYTES_PER_ELEMENT;

    return this;
  }

  writeBoolean(value: boolean) {
    return this.writeUint8(value ? 1 : 0);
  }

  getBoolean() {
    return this.getUint8() === 1;
  }

  writeUint64(value: bigint) {
    this.view.setBigUint64(this.offset, value);

    this.offset += BigUint64Array.BYTES_PER_ELEMENT;

    return this;
  }

  writeUint16(value: number) {
    this.view.setUint16(this.offset, value);

    this.offset += Uint16Array.BYTES_PER_ELEMENT;

    return this;
  }

  get isFinished() {
    return this.offset === this.view.byteLength;
  }

  get remaining() {
    return this.view.byteLength - this.offset;
  }

  toBuffer() {
    if (!this.isFinished) throw new Error("Buffer is not finished");

    return this.buffer;
  }
}
