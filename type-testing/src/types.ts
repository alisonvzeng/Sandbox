import { z } from "zod";

// Various comments include "UNCOMMENT:" or "COMMENT:", which upon following will allow you to see the compile/type error. You can also collapse regions :)

// #region ------------------ Branding inside Lazy ----------------------------

// We can define the schema to be evaluated to include a brand
// z.ZodType<TreeNode, unknown, z.core.$ZodTypeInternals<TreeNode, unknown>>
export const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() => {
  console.log("Evaluating TreeNodeSchema");

  return z
    .object({
      children: z.array(TreeNodeSchema),
    })
    .brand("TreeNode");
});

// And define the type explicitly and & the Zod brand
type TreeNode = { children: TreeNode[] } & z.BRAND<"TreeNode">;

// How does this work on example data?
const validTree = {
  children: [{ children: [] }, { children: [{ children: [] }] }],
};
const parsedTree = TreeNodeSchema.parse(validTree); // note that the lazy msg is only logged once -> the evaluated schema is cached and reused (not only for children, but also for future parses)
// (ZodLazyInternals) https://github.com/colinhacks/zod/blob/7e7e3461aceecf3633e158df50d6bc852e7cdf45/packages/zod/src/v4/core/schemas.ts#L3735
// (defineLazy util fn) https://github.com/colinhacks/zod/blob/7e7e3461aceecf3633e158df50d6bc852e7cdf45/packages/zod/src/v4/core/util.ts#L262
const invalidTree = {
  children: [
    { children: [] },
    { children: [{ children: "not an array" }] }, // invalid
  ],
};

testTreeNodeSchema("validTree", validTree);
testTreeNodeSchema("invalidTre", invalidTree); // does not parse successfully

const raw = { children: [] };
// const error: TreeNode = raw; // UNCOMMENT: invalid due to lack of brand
const node = TreeNodeSchema.parse(raw);
const parent_w_raw = { children: [raw] };
const parent_w_node = { children: [node] };

testTreeNodeSchema("raw", raw);
testTreeNodeSchema("parent_w_raw", parent_w_raw);
testTreeNodeSchema("parent_w_node", parent_w_node);

function testTreeNodeSchema(name: string, testTree: any) {
  try {
    const parsed = TreeNodeSchema.parse(testTree);
    console.log(name, " Tree parsed successfully:", parsed);
  } catch (e) {
    console.error(name, " Tree failed validation:", e);
  }
}

// #endregion

// #region ------------------ Branding outside Lazy (Cyclic) ----------------------------

/** Internal use only; do not export this. The child type needs to refer to the branded version,
 *  or we will get type errors attempting to access node.children. */
interface __CTreeNode {
  children: CTreeNode[];
}

interface __BTreeNode {
  children: BTreeNode[];
}

/** External graph node type, produced only by Zod due to the z.BRAND. */
export type CTreeNode = __CTreeNode & z.BRAND<"TreeNode">;

/** Recursive schema, with a type assertion (or "typecast"). */
// z.ZodType<CTreeNode, unknown, z.core.$ZodTypeInternals<CTreeNode, unknown>>
export const CTreeNodeSchema: z.ZodType<CTreeNode> = z
  .lazy(() => z.object({ children: z.array(CTreeNodeSchema) }))
  .transform((data) => data as CTreeNode);

export type BTreeNode = __BTreeNode & z.BRAND<"BTreeNode">;

// Inferred type w/o transform: ZodLazy<ZodObject<{ children: ZodArray<ZodType<BTreeNode, unknown, $ZodTypeInternals<BTreeNode, unknown>>>; }, $strip>>
export const BTreeNodeSchema: z.ZodType<BTreeNode> = z.lazy(
  () =>
    z
      .object({
        children: z.array(BTreeNodeSchema),
      })
      .transform((data) => data as BTreeNode) // COMMENT: we can transform within the lazy as well, it  seems
);

// #endregion

// #region ------------------ Branding outside Lazy (Noncyclic) ----------------------------

const arrayNumSchema = z
  .array(z.number().multipleOf(2))
  .refine((arr) => arr.length % 2 == 1)
  .brand("OddArrayEvenNumbers");

type OddArrayEvenNumbers = z.infer<typeof arrayNumSchema>;

const nbArrayNumSchema = z
  .array(z.number().multipleOf(2))
  .refine((arr) => arr.length % 2 == 1);
const fnBrandedArrayNumSchema = nbArrayNumSchema.brand("OddArrayEvenNumbers");

const valid: OddArrayEvenNumbers = arrayNumSchema.parse([2, 4, 6]);
const alsoValid: OddArrayEvenNumbers = fnBrandedArrayNumSchema.parse([2, 4, 6]);

// Because the following lazy schemas are noncyclic, they don't need to be type annotated, and Zod can infer their type.

// z.core.$ZodBranded<z.ZodLazy<z.ZodArray<z.ZodNumber>>, "OddArrayEvenNumbers">
const lazyBrandArrayNumSchema = z
  .lazy(() =>
    z.array(z.number().multipleOf(2)).refine((arr) => arr.length % 2 == 1)
  )
  .brand("OddArrayEvenNumbers");

// However, if we do annotate, we will get an error. brand() wraps whatever ZodType with a ZodBranded
// (brand fn) https://github.com/colinhacks/zod/blob/7e7e3461aceecf3633e158df50d6bc852e7cdf45/packages/zod/src/v4/classic/schemas.ts#L43

// $ZodBranded<ZodLazy<ZodArray<ZodNumber>>, "OddArrayEvenNumbers">
// UNCOMMENT: the following block
// const typeAnnotatedLazyBrandArrayNumSchema: z.ZodType<OddArrayEvenNumbers> = z
//   .lazy(() =>
//     z.array(z.number().multipleOf(2)).refine((arr) => arr.length % 2 == 1)
//   )
//   .brand("OddArrayEvenNumbers");

// But brand() within lazy() works regardless of type annotation, since the whole evaluation is delayed
// z.ZodLazy<z.core.$ZodBranded<z.ZodArray<z.ZodNumber>, "OddArrayEvenNumbers">>
const brandLazyArrayNumSchema = z.lazy(() =>
  z
    .array(z.number().multipleOf(2))
    .refine((arr) => arr.length % 2 == 1)
    .brand("OddArrayEvenNumbers")
);

// z.ZodType<number[] & z.core.$brand<"OddArrayEvenNumbers">, unknown, z.core.$ZodTypeInternals<number[] & z.core.$brand<"OddArrayEvenNumbers">, unknown>>
const typeAnnotatedBrandLazyArrayNumSchema: z.ZodType<OddArrayEvenNumbers> =
  z.lazy(() =>
    z
      .array(z.number().multipleOf(2))
      .refine((arr) => arr.length % 2 == 1)
      .brand("OddArrayEvenNumbers")
  );

// Zod infers the same type for both: number[] & z.core.$brand<"OddArrayEvenNumbers"> since the shape and brand are the same
type lazyBrandOddArrayEvenNumbers = z.infer<typeof lazyBrandArrayNumSchema>;
type brandLazyOddArrayEvenNumbers = z.infer<typeof brandLazyArrayNumSchema>;

function lbaverage(numbers: lazyBrandOddArrayEvenNumbers): number {
  const sum = numbers.reduce((total, current) => total + current, 0);
  return sum / numbers.length;
}

function blaverage(numbers: brandLazyOddArrayEvenNumbers): number {
  const sum = numbers.reduce((total, current) => total + current, 0);
  return sum / numbers.length;
}

// Which means this is all valid
console.log(lbaverage(lazyBrandArrayNumSchema.parse([2, 4, 6])));
console.log(blaverage(lazyBrandArrayNumSchema.parse([2, 4, 6])));
console.log(blaverage(brandLazyArrayNumSchema.parse([2, 4, 6])));
console.log(lbaverage(brandLazyArrayNumSchema.parse([2, 4, 6])));

// #endregion
