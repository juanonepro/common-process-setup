import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";

/** Render a lucide icon by its string name (from phase/kind metadata). */
export function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = (icons as unknown as Record<string, React.ComponentType<LucideProps>>)[
    name
  ];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}
