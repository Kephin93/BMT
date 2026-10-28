"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductGallery({
  img = [],
  title,
}: {
  img: string[];
  title: string;
}) {
  const photos = [...new Set(img?.filter(Boolean) ?? [])];

  if (!photos.length) {
    return (
      <img
        src="/default.webp"
        alt={title}
        className="aspect-[3/2] w-full rounded-lg bg-muted object-contain"
      />
    );
  }

  return (
    <Tabs defaultValue={photos[0]} className="min-w-0 gap-3">
      <div className="min-w-0">
        {photos.map((photo, index) => (
          <TabsContent key={photo} value={photo} className="overflow-hidden rounded-lg bg-muted">
            <img
              src={photo}
              alt={`${title} — photo ${index + 1}`}
              className="aspect-[3/2] w-full object-contain"
            />
          </TabsContent>
        ))}
      </div>
      <TabsList
        aria-label={`${title} photos`}
        className="h-auto w-full justify-start gap-3 overflow-x-auto rounded-none bg-transparent p-1"
      >
        {photos.map((photo, index) => (
          <TabsTrigger
            key={photo}
            value={photo}
            aria-label={`View photo ${index + 1} of ${title}`}
            className="h-16 w-24 flex-none overflow-hidden rounded-md border border-primary/15 p-0 focus-visible:outline-primary focus-visible:ring-primary/40 data-[state=active]:border-primary data-[state=active]:shadow-none md:h-20 md:w-28"
          >
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
