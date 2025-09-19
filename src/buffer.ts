export class BufferView {
  private view: DataView;
  private buffer: ArrayBufferLike;

  private offset = 0;
  private start = 0;

  reset() {
    this.offset = 0;
    return this;
  }

  private constructor(
    buffer: ArrayBufferLike,
    byteOffset = 0,
    byteLength?: number,
  ) {
    this.view = new DataView(buffer as ArrayBuffer, byteOffset, byteLength);
    this.buffer = buffer;
    this.start = byteOffset;
  }

  static create(bufferOrView: ArrayBufferLike | ArrayBufferView) {
    if (ArrayBuffer.isView(bufferOrView)) {
      return new BufferView(
        bufferOrView.buffer,
        bufferOrView.byteOffset,
        bufferOrView.byteLength,
      );
    }

    return new BufferView(bufferOrView);
  }

  readString(decoder = new TextDecoder()) {
    return decoder.decode(this.readBytes());
  }

  readBytes() {
    const stringLength = this.readUint8();

    if (stringLength === 0) return new Uint8Array(0);

    const remaining = this.view.byteLength - this.offset;
    if (remaining < stringLength)
      throw new Error(
        `string length field mismatch, expected ${stringLength}, got ${remaining}`,
      );

    const absoluteStart = this.start + this.offset;
    const stringBytes = new Uint8Array(
      this.buffer as ArrayBuffer,
      absoluteStart,
      stringLength,
    );

    this.offset += stringLength;

    return stringBytes;
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

  readUint32() {
    const value = this.view.getUint32(this.offset);

    this.offset += Uint32Array.BYTES_PER_ELEMENT;

    return value;
  }

  writeUint32(value: number) {
    this.view.setUint32(this.offset, value);

    this.offset += Uint32Array.BYTES_PER_ELEMENT;

    return this;
  }

  readUint8() {
    const value = this.view.getUint8(this.offset);

    this.offset += Uint8Array.BYTES_PER_ELEMENT;

    return value;
  }

  readUint64() {
    const value = this.view.getBigUint64(this.offset);

    this.offset += BigUint64Array.BYTES_PER_ELEMENT;

    return value;
  }

  readUint16() {
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

  readBoolean() {
    return this.readUint8() === 1;
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

  toTypedArray() {
    // If the DataView spans the full underlying buffer and we've written
    // all bytes, return the original ArrayBuffer (no copy).
    if (this.start === 0 && this.offset === this.view.byteLength) {
      return new Uint8Array(this.buffer);
    }

    // Otherwise return a zero-copy typed view into the underlying buffer
    // that represents only the written bytes.
    return new Uint8Array(this.buffer, this.start, this.offset);
  }
}
