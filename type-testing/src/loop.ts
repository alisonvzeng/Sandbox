import { z } from "zod";

// npm run start

const malformed_data = [
  ["Bob", 10, "cat"],
  ["Alice", "15", "dog"],
  ["Eve", 20, "mouse"],
];

const rowSchema = z.array(
  z
    .tuple([
      z.string().min(2).max(100),
      z.number().min(0),
      z.string().min(2).max(100),
    ])
    .transform(([name, age, pet]) => ({ name, age, pet }))
);

for (const [i, row] of malformed_data.entries()) {
  const parsedRow = rowSchema.safeParse([row]);

  if (!parsedRow.success) {
    console.error("Invalid data format", parsedRow.error);
  } else {
    console.log("Valid data", parsedRow.data);
  }
}
