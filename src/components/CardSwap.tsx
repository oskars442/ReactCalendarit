"use client";

import React, { forwardRef, ReactNode, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

/* =========================
   Types
   ========================= */
export type CardSwapImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: 'cover' | 'contain';
  bg?: string;
  padding?: number;
  zoom?: number;           // NEW
  pos?: string;            // NEW e.g. 'center', '50% 40%'
};
export type CardSwapProps = {
  images: CardSwapImage[];
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  startIndex?: number;
  skewAmount?: number;
  easing?: "elastic" | "linear";
  className?: string;
  onCardClick?: (idx: number) => void;
  /** Jauna: globāla X/Y nobīde visam stackam (px) */
  offsetX?: number;
  offsetY?: number;
  dropDistance?: number;
};

/* =========================
   InnerCard
   ========================= */
export interface InnerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
  children?: ReactNode;
}

const InnerCard = forwardRef<HTMLDivElement, InnerCardProps>(
  ({ customClass, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={[
        "absolute top-1/2 left-1/2",
        "rounded-xl border border-white/25 bg-black",
        "[transform-style:preserve-3d] [backface-visibility:hidden] [will-change:transform]",
        "shadow-2xl overflow-hidden",
        customClass ?? "",
        rest.className ?? "",
      ]
        .join(" ")
        .trim()}
    />
  ),
);
InnerCard.displayName = "InnerCard";

/* =========================
   Helpers
   ========================= */
type Slot = { x: number; y: number; z: number; zIndex: number };

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number, offX = 0, offY = 0) =>
  gsap.set(el, {
    x: slot.x + offX,
    y: slot.y + offY,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });

/* =========================
   Component
   ========================= */
export default function CardSwap({
  images,
  width = 620,
  height = 380,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 4200,
  pauseOnHover = true,
  startIndex = 0,
  skewAmount = 6,
  easing = "elastic",
  className = "",
  onCardClick,
  offsetX = 0,
  offsetY = 0,
  dropDistance = 240,
}: CardSwapProps) {
  const total = images.length;
  if (total === 0) return null;

  type EaseLike = gsap.EaseFunction | string;
  const config: {
    ease: EaseLike;
    durDrop: number;
    durMove: number;
    durReturn: number;
    promoteOverlap: number;
    returnDelay: number;
  } =
    easing === "elastic"
      ? {
          ease: "elastic.out(0.6,0.9)",
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: "power1.inOut",
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  // elementu refi ar callback
  const elsRef = useRef<Array<HTMLDivElement | null>>([]);
  const idxArr = useMemo(() => Array.from({ length: total }, (_, i) => i), [total]);

  const order = useRef<number[]>(
    Array.from({ length: total }, (_, i) => (i + startIndex) % total),
  );

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = elsRef.current;
    if (nodes.length < total || nodes.some((n) => !n)) return;

    // sākotnējais izvietojums ar globālo nobīdi
    nodes.forEach((el, i) => {
      if (el) placeNow(el, makeSlot(i, cardDistance, verticalDistance, total), skewAmount, offsetX, offsetY);
    });

    const swap = () => {
      if (order.current.length < 2) return;
      const nodes = elsRef.current as HTMLDivElement[];

      const [front, ...rest] = order.current;
      const elFront = nodes[front];
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      // 1) priekšējā krīt uz leju (ar nobīdi)
      tl.to(elFront, {
       y: "+=" + dropDistance, // nobīde netiek mainīta, tikai kritiens
        duration: config.durDrop,
        ease: config.ease,
      });

      // 2) pārējās paceļas par slotu, bet ar globālo offset
      tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = nodes[idx];
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          {
            x: slot.x + offsetX,
            y: slot.y + offsetY,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`,
        );
      });

      // 3) priekšējo ieliek pašā aizmugurē ar nobīdi
      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
      tl.call(() => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      }, undefined, "return");
      tl.to(
        elFront,
        {
          x: backSlot.x + offsetX,
          y: backSlot.y + offsetY,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return",
      );

      // 4) jauna secība
      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    // autoplay helpers
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const start = () => {
      stop();
      intervalRef.current = window.setInterval(swap, delay) as unknown as number;
    };

    swap();
    start();

    if (pauseOnHover) {
      const node = wrapRef.current!;
      const pause = () => {
        tlRef.current?.pause();
        stop();
      };
      const resume = () => {
        tlRef.current?.play();
        start();
      };
      node.addEventListener("mouseenter", pause);
      node.addEventListener("mouseleave", resume);
      return () => {
        node.removeEventListener("mouseenter", pause);
        node.removeEventListener("mouseleave", resume);
        stop();
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    total,
    cardDistance,
    verticalDistance,
    delay,
    pauseOnHover,
    skewAmount,
    easing,
    offsetX,
    offsetY,
  ]);

  return (
    <div
      ref={wrapRef}
      className={["relative overflow-visible perspective-[900px]", className].join(" ")}
      tabIndex={0}
      aria-label="Card stack preview"
    >
{idxArr.map((i) => {
  const img = images[i];
  const fit = img.fit ?? 'cover';
  const pad = img.padding ?? 0;
  const bg = img.bg ?? 'transparent';
  const zoom = img.zoom ?? 1;
  const pos = img.pos ?? 'center';

  return (
    <InnerCard
      key={i}
      ref={(el: HTMLDivElement | null) => { elsRef.current[i] = el; }}
      style={{ width, height }}
      onClick={() => onCardClick?.(i)}
    >
      <div style={{ background: bg, padding: pad, width: '100%', height: '100%' }}>
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width:1280px) 640px, (min-width:1024px) 560px, 100vw"
            style={{
              objectFit: fit,
              objectPosition: pos,
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              transformOrigin: 'center',
            }}
            priority={i === 0}
          />
        </div>
      </div>
    </InnerCard>
  );
})}
    </div>
  );
}
