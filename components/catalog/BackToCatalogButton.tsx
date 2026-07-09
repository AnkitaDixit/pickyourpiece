"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Props {
  className?: string;
  fallbackHref?: string;
  children: ReactNode;
}

export default function BackToCatalogButton({
  className,
  fallbackHref = "/",
  children,
}: Props) {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined") {
      const sameOriginReferrer = document.referrer.startsWith(window.location.origin);
      if (sameOriginReferrer && window.history.length > 1) {
        router.back();
        return;
      }
    }

    router.push(fallbackHref);
  };

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
