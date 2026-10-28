import { encodeLosslessWebP } from "./lossless-webp";

self.onmessage = async (event: MessageEvent<File>) => {
  let bitmap: ImageBitmap | undefined;
  try {
    const file = event.data;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (file.type === "image/webp" && String.fromCharCode(...bytes.slice(12, 16)) === "VP8X" && (bytes[20] & 2)) {
      throw new Error("Animated WebP is not supported. Choose a still picture.");
    }
    if (file.type === "image/png") {
      if (bytes[24] > 8) throw new Error("Choose an 8-bit PNG or JPEG. High-bit-depth PNG cannot be preserved in WebP.");
      const view = new DataView(bytes.buffer);
      for (let offset = 8; offset + 12 <= bytes.length;) {
        const chunk = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
        if (chunk === "acTL") throw new Error("Animated PNG is not supported. Choose a still picture.");
        if (chunk === "IDAT") break;
        offset += view.getUint32(offset) + 12;
      }
    }
    bitmap = await createImageBitmap(file);
    if (bitmap.width > 16383 || bitmap.height > 16383) throw new Error("Picture dimensions exceed the WebP limit of 16383 pixels per side.");
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the picture.");
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
    const blob = await encodeLosslessWebP(image);
    self.postMessage({ blob });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Picture could not be encoded." });
  } finally {
    bitmap?.close();
  }
};
