"use client";

import { useState } from "react";
import { ProductGallery } from "@/components/product-gallery";

/** Product page media: the product video first, with the images one tap away. Falls back to images if the video fails. */
export function ProductVideo({ src, name, images }: { src: string; name: string; images: string[] }) {
  const [failed, setFailed] = useState(false);
  const [showImages, setShowImages] = useState(false);
  if (failed || showImages) {
    return (
      <div className="flex flex-col gap-3">
        <ProductGallery name={name} images={images} />
        {!failed && (
          <button type="button" onClick={() => setShowImages(false)} className="btn-outline w-fit py-2 text-sm">
            ▶ Play video
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <video
        src={src}
        poster={images[0]}
        autoPlay
        loop
        muted
        playsInline
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        preload="auto"
        aria-label={`${name} video`}
        onError={() => setFailed(true)}
        className="aspect-square w-full rounded-[18px] bg-surface object-contain"
      />
      <button type="button" onClick={() => setShowImages(true)} className="btn-outline w-fit py-2 text-sm">
        View images
      </button>
    </div>
  );
}
