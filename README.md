# `small-frame`

Zero-dependency structured message frame for small binary messages.

> [!WARNING]
> This project is still in development and the API is not stable.

## Usage

```ts
import { createMessageFrameFromStructure, FrameFieldTypes } from "small-frame";

const UserFrame = createMessageFrameFromStructure({
  name: FrameFieldTypes.String,
  age: FrameFieldTypes.Number,
  isAdmin: FrameFieldTypes.Boolean,
});

export type User = typeof UserFrame.$type;

const user = {
  name: "John Doe",
  age: 20,
  isAdmin: false,
};

const buffer = UserFrame.serialize(user);

const user2 = UserFrame.deserialize(buffer);

console.log(user2);
```
