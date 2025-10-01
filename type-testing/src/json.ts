import { z } from "zod";

// npm run start

console.log("Fetching data from Census API...");

const response = await fetch(
  "https://api.census.gov/data/2023/acs/acs5/subject/variables?get=NAME,S2802_C03_022E&for=county:*&in=state:44"
);
const json = await response.json();

const header = ["NAME", "S2802_C03_022E", "state", "county"];

const censusDataSchema = z
  .array(
    z
      .array(z.string())
      .refine((arr) => arr.length == 4)
      .transform((arr) => [arr[0], parseFloat(arr[1]), arr[2], arr[3]]) // each cell must be a non-empty string
  )
  .refine(
    (arr) => arr.length > 0 && arr[0].every((cell, i) => cell === header[i]),
    { message: "First row must be the correct header" }
  );

const parsedData = censusDataSchema.safeParse(json);

if (!parsedData.success) {
  console.error("Invalid data format", parsedData.error);
} else {
  console.log("Valid data", parsedData.data);
}
