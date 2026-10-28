"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, ArrowDown, GripVertical, ImagePlus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProductImage = { id: string; url: string; name: string; file?: File };

export default function ProductImages({ images, onChange, disabled }: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  disabled: boolean;
}) {
  const inputId = useId();
  const urls = useRef(new Set<string>());
  const draggedId = useRef<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ownedUrls = urls.current;
    return () => { ownedUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  function addFiles(files: File[]) {
    if (disabled || !files.length) return;
    setError("");
    if (images.length + files.length > 21) {
      setError("Choose up to 21 pictures per product.");
      return;
    }
    const invalid = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 20 * 1024 * 1024);
    if (invalid) {
      setError(`${invalid.name}: choose a JPEG, PNG, or WebP picture up to 20 MB.`);
      return;
    }
    onChange([...images, ...files.map((file) => {
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      return { id: crypto.randomUUID(), url, name: file.name, file };
    })]);
  }

  function moveImage(from: number, to: number) {
    if (disabled || from < 0 || to < 0 || from >= images.length || to >= images.length || from === to) return;
    const next = [...images];
    const [image] = next.splice(from, 1);
    next.splice(to, 0, image);
    onChange(next);
  }

  return (
    <section aria-labelledby={`${inputId}-heading`} className="space-y-4">
      <h2 id={`${inputId}-heading`} className="text-lg font-semibold">Pictures</h2>
      <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div
          className="flex min-h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-muted/30 p-5 text-center transition-colors hover:border-primary focus-within:ring-2 focus-within:ring-primary"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}
        >
          <ImagePlus aria-hidden="true" className="mb-3 size-8 text-primary" />
          <label htmlFor={inputId} className="mb-3 block font-medium">Drag and drop pictures here, or choose files</label>
          <input
            id={inputId} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled}
            className="w-full min-w-0 text-xs file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
            aria-describedby={`${inputId}-hint`}
            onChange={(event) => { addFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }}
          />
          <p id={`${inputId}-hint`} className="mt-3 text-xs">JPEG, PNG, or still WebP. Up to 21 pictures, 20 MB each.</p>
        </div>
        <div className="min-w-0 space-y-3">
          <p id={`${inputId}-order-hint`} className="text-sm">The top picture is the required cover. Drag rows to reorder, or use the arrow buttons.</p>
          {images.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm">
              <p>Currently 0 images for this product.</p>
              <p className="mt-2 font-medium">A cover image is required.</p>
            </div>
          ) : (
            <ol aria-label="Product pictures in display order" aria-describedby={`${inputId}-order-hint`} className="max-h-80 space-y-2 overflow-y-auto p-1">
              {images.map((image, index) => (
                <li
                  key={image.id}
                  draggable={!disabled}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 ${disabled ? "" : "cursor-grab active:cursor-grabbing"} ${index === 0 ? "border-primary/40 bg-muted/30" : "bg-white"}`}
                  onDragStart={(event) => {
                    if (disabled) { event.preventDefault(); return; }
                    draggedId.current = image.id;
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("application/x-bmt-product-image", image.id);
                  }}
                  onDragEnd={() => { draggedId.current = null; }}
                  onDragOver={(event) => { event.preventDefault(); }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (disabled || !draggedId.current) return;
                    const from = images.findIndex((item) => item.id === draggedId.current);
                    draggedId.current = null;
                    moveImage(from, index);
                  }}
                >
                  <GripVertical aria-hidden="true" className="size-4 shrink-0 text-primary/50" />
                  <img src={image.url} alt={image.name} draggable={false} className="size-14 shrink-0 rounded-md bg-muted/30 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs" title={image.name}>{image.name}</p>
                    {index === 0 && <p className="mt-1 text-xs font-semibold text-primary">Cover image · Required</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Button type="button" variant="ghost" size="icon" disabled={disabled || index === 0}
                        aria-label={index === 0 ? `${image.name} is the cover` : `Use ${image.name} as cover`} title={index === 0 ? "Cover image" : "Use as cover"}
                        onClick={() => moveImage(index, 0)}>
                        <Star aria-hidden="true" fill={index === 0 ? "currentColor" : "none"} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" disabled={disabled || index === 0}
                        aria-label={`Move ${image.name} earlier`} onClick={() => moveImage(index, index - 1)}><ArrowUp aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon" disabled={disabled || index === images.length - 1}
                        aria-label={`Move ${image.name} later`} onClick={() => moveImage(index, index + 1)}><ArrowDown aria-hidden="true" /></Button>
                      <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Remove ${image.name}`}
                        onClick={() => {
                          if (urls.current.delete(image.url)) URL.revokeObjectURL(image.url);
                          onChange(images.filter((item) => item.id !== image.id));
                        }}><X aria-hidden="true" /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={disabled}>Preview</Button>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
