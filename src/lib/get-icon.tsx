import "server-only";
// Should only be used in server component because it imports all icons,
// which would be too heavy for the client.

import * as LucideIcon from "lucide-react";
import Image from "next/image";
import { cn } from "~/lib/utils";

export function getIcon(
  icon: string | null | undefined,
  className?: string | null,
  bakcground?: string,
): React.ReactNode {
  if (!icon) return null;
  if (icon.startsWith("lucide:")) {
    const iconName = icon.slice(7) as keyof typeof LucideIcon;
    const Icon = LucideIcon[iconName] as React.ElementType;
    return <Icon className={cn("text-primary h-5 w-5", className)} />;
  }
  if (icon.startsWith("url:")) {
    return (
      <Image
        src={icon.slice(4)}
        alt={icon}
        width={40}
        height={40}
        className={cn("rounded-lg", className)}
        style={{ backgroundColor: bakcground }}
      />
    );
  }
  return null;
}
