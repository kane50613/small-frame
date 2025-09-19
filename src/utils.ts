export function calculateSerializedSize(data: NonNullable<unknown>): number {
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

        return data.length * calculateSerializedSize(data[0]);
      }

      return Object.values(data).reduce(
        (acc, value) => acc + calculateSerializedSize(value),
        0,
      );
    }
    default:
      throw new Error("Invalid data type");
  }
}
