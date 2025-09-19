# `small-frame`

Zero-dependency structured message frame for small binary messages using the **Really Compact Structured Binary (RCSB)** encoding format.

> [!WARNING]
> This project is still in development and the API is not stable.

## Really Compact Structured Binary (RCSB) Specification

RCSB is a compact, type-safe binary serialization format designed for _really small structured messages_. It provides predictable encoding with minimal overhead and strong type safety.

### Data Types

| Type | Size | Description |
|------|------|-------------|
| `Boolean` | 1 byte | `0x00` for false, `0x01` for true |
| `Number` | 4 bytes | 32-bit unsigned integer (uint32) |
| `BigInt` | 8 bytes | 64-bit unsigned integer (uint64) |
| `String` | 1 + N bytes | Length prefix (uint8) + UTF-8 encoded bytes |

### String Encoding

Strings are encoded as:

```text
[length: uint8][utf8_bytes...]
```

- Maximum string length: 255 bytes (uint8 max)
- UTF-8 encoding is used for text

### Structure Encoding

Message structures are encoded by concatenating fields in definition order:

```text
field1_bytes + field2_bytes + field3_bytes + ...
```

No delimiters or padding between fields. The total size is the sum of all field sizes.

### Size Calculation

The serialized size can be calculated as:

- `Boolean`: 1 byte
- `Number`: 4 bytes
- `BigInt`: 8 bytes
- `String`: 1 + UTF-8 byte length

## Usage

```ts
import { createFrameFromFields, FieldType } from "small-frame";

const UserFrame = createFrameFromFields({
  name: FieldType.String,
  age: FieldType.Number,
  isAdmin: FieldType.Boolean,
});

export type User = typeof UserFrame.dataType;

const user = { 
  name: "Kane", 
  age: 20, 
  isAdmin: false 
};

// Serialize to RCSB format
const buffer = UserFrame.serialize(user);

// Deserialize from RCSB format
const user2 = UserFrame.deserialize(buffer);

console.log(user2);
```

The value will be serialized as:

```hex
04 4b 61 6e 65 00 00 00 14 00
│              │            │
│              │            │
└─ "Kane" (5)  └─ 20 (4)    └─ false (1)
```

Total size: 10 bytes
