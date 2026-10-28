import encode from "@jsquash/webp/encode.js";

export async function encodeLosslessWebP(image: ImageData) {
  const bytes = await encode(image, {
    lossless: 1,
    near_lossless: 100,
    quality: 100,
    alpha_quality: 100,
    exact: 1,
  });
  return new Blob([bytes], { type: "image/webp" });
}
