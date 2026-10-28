import { z } from "zod";

const imagePath = z.string().trim().min(1, "Enter an image URL or path.").refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "Use an HTTP(S) image URL or a path starting with /.");

export const productSchema = z.object({
  title: z.string().trim().min(1, "Enter a product name.").max(200),
  subTitle: z.string().trim().max(5000),
  price: z.number().finite().nonnegative("Price must be zero or greater."),
  img: z.array(imagePath).min(1, "Choose at least one picture.").max(21),
  recommended: z.boolean(),
});

export type ProductValues = z.infer<typeof productSchema>;
