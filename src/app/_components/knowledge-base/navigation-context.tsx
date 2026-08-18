"use client";

import {
  createContext,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  useContext,
} from "react";
import Link from "next/link";

type Navigate = (href: string) => void;

const KnowledgeBaseNavigationContext = createContext<Navigate | null>(null);

export function KnowledgeBaseNavigationProvider({
  navigate,
  children,
}: {
  navigate: Navigate | null;
  children: ReactNode;
}) {
  return (
    <KnowledgeBaseNavigationContext.Provider value={navigate}>
      {children}
    </KnowledgeBaseNavigationContext.Provider>
  );
}

type KnowledgeBaseLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function KnowledgeBaseLink({
  href,
  onClick,
  target,
  ...props
}: KnowledgeBaseLinkProps) {
  const navigate = useContext(KnowledgeBaseNavigationContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      !navigate ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target !== undefined && target !== "_self") ||
      event.currentTarget.hasAttribute("download")
    ) {
      return;
    }

    event.preventDefault();
    navigate(href);
  }

  return (
    <Link
      {...props}
      href={href}
      target={target}
      onClick={handleClick}
      prefetch={false}
    />
  );
}
