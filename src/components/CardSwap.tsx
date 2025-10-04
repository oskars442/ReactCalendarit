"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

type CardSwapImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export default function CardSwap({
  images,
  className = "",
  buttonClassName = "",
}: {
  images: CardSwapImage[];            // iedod 2..n bildes
  className?: string;                 // wrappera papildklases (piem., border/p)
  buttonClassName?: string;           // pogu stilam (ja gribi pārrakstīt)
}) {
  // aktīvais indekss
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  // vertikālā “swap” animācija
  const variants = {
    enter: { y: 32, opacity: 0, rotate: -1, scale: 0.99, filter: "blur(4px)" },
    center: { y: 0, opacity: 1, rotate: 0, scale: 1, filter: "blur(0px)" },
    exit:  { y: -32, opacity: 0, rotate: 1, scale: 0.99, filter: "blur(4px)" },
  };

  const current = images[index];

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2",
        "shadow-2xl ring-1 ring-white/10 backdrop-blur",
        className,
      ].join(" ")}
    >
      <div className="relative h-full w-full rounded-xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.src}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ type: "spring", stiffness: 180, damping: 26, opacity: { duration: 0.35 } }}
          >
            <Image
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              className="w-full h-auto rounded-xl"
              priority
              sizes="(min-width: 1280px) 620px, (min-width: 1024px) 520px, 100vw"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Kontroles */}
      {images.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between p-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className={[
                "pointer-events-auto rounded-full bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-2 text-white",
                buttonClassName,
              ].join(" ")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className={[
                "pointer-events-auto rounded-full bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-2 text-white",
                buttonClassName,
              ].join(" ")}
            >
              ›
            </button>
          </div>

          <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={[
                  "h-1.5 w-5 rounded-full transition-all",
                  i === index ? "bg-white/90" : "bg-white/40 hover:bg-white/60",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
