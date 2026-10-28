export function encodeLocalImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./webp.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      worker.terminate();
      if (event.data.blob) resolve(event.data.blob);
      else reject(new Error(event.data.error || "Picture could not be encoded."));
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Image encoder could not start. Please try again in a current browser."));
    };
    worker.postMessage(file);
  });
}
