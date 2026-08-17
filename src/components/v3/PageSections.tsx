import { useState } from "react";
import { CalendarDays, FileText, HelpCircle, Plus, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// The page body — what participants read on the process page, edited in place.
//
// One calm card per section: icon, title, and the content itself. The helper
// line only appears while a section is empty, so guidance shows up when it's
// useful and gets out of the way once there's something to read.
// ---------------------------------------------------------------------------

export type SectionKind = "about" | "events" | "faqs" | "text";

export interface SectionItem {
  id: string;
  title: string;
  detail: string;
}

export interface PageSection {
  id: string;
  kind: SectionKind;
  title: string;
  body: string;
  items: SectionItem[];
}

interface SectionDef {
  title: string;
  icon: React.ReactNode;
  helper: string;
  /** Prose sections get a textarea; list sections get repeatable items. */
  placeholder?: string;
  addLabel?: string;
  itemLabels?: [string, string];
  /** Only custom text sections are renamed by the admin. */
  renamable?: boolean;
}

const SECTION_DEFS: Record<SectionKind, SectionDef> = {
  about: {
    title: "About",
    icon: <FileText className="size-[18px]" aria-hidden />,
    helper: "The intro people see first — what this is and how to take part.",
    placeholder: "Write a short intro for participants…",
  },
  events: {
    title: "Events",
    icon: <CalendarDays className="size-[18px]" aria-hidden />,
    helper: "Meetings and moments around your process, on or off Common.",
    addLabel: "Add an event",
    itemLabels: ["Event name", "When and where"],
  },
  faqs: {
    title: "FAQs",
    icon: <HelpCircle className="size-[18px]" aria-hidden />,
    helper: "Answer common questions so people know how to take part.",
    addLabel: "Add a question",
    itemLabels: ["Question", "Answer"],
  },
  text: {
    title: "New section",
    icon: <Type className="size-[18px]" aria-hidden />,
    helper: "Anything else participants should know.",
    placeholder: "Write anything else participants should know…",
    renamable: true,
  },
};

export function newSection(kind: SectionKind): PageSection {
  return { id: uid("sec"), kind, title: SECTION_DEFS[kind].title, body: "", items: [] };
}

/** A page starts with the intro; everything else is added deliberately. */
export function defaultSections(): PageSection[] {
  return [newSection("about")];
}

export function PageContent({
  sections,
  onChange,
}: {
  sections: PageSection[];
  onChange: (next: PageSection[]) => void;
}) {
  const patch = (id: string, p: Partial<PageSection>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...p } : s)));

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onPatch={(p) => patch(section.id, p)}
          onRemove={() => onChange(sections.filter((s) => s.id !== section.id))}
        />
      ))}

      <AddSection
        hasAbout={sections.some((s) => s.kind === "about")}
        onAdd={(kind) => onChange([...sections, newSection(kind)])}
      />
    </div>
  );
}

function SectionCard({
  section,
  onPatch,
  onRemove,
}: {
  section: PageSection;
  onPatch: (p: Partial<PageSection>) => void;
  onRemove: () => void;
}) {
  const def = SECTION_DEFS[section.kind];
  const empty = section.items.length === 0 && !section.body.trim();

  const addItem = () =>
    onPatch({ items: [...section.items, { id: uid("item"), title: "", detail: "" }] });
  const patchItem = (id: string, p: Partial<SectionItem>) =>
    onPatch({ items: section.items.map((i) => (i.id === id ? { ...i, ...p } : i)) });
  const removeItem = (id: string) =>
    onPatch({ items: section.items.filter((i) => i.id !== id) });

  return (
    <section className="group/section relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
          {def.icon}
        </span>
        <div className="min-w-0 flex-1">
          {def.renamable ? (
            <input
              value={section.title}
              onChange={(e) => onPatch({ title: e.target.value })}
              aria-label="Section title"
              placeholder="Section title"
              className="-mx-1.5 w-[calc(100%+0.75rem)] rounded-[var(--radius-sm)] bg-transparent px-1.5 py-0.5 text-[15px] font-medium leading-tight outline-none transition-colors hover:bg-[var(--color-muted)] focus:bg-[var(--color-muted)]"
            />
          ) : (
            <p className="text-[15px] font-medium leading-tight">{section.title}</p>
          )}

          {empty && (
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-muted-foreground)]">
              {def.helper}
            </p>
          )}

          {def.placeholder && (
            <Textarea
              value={section.body}
              onChange={(e) => onPatch({ body: e.target.value })}
              aria-label={section.title}
              placeholder={def.placeholder}
              className="mt-3"
            />
          )}

          {def.addLabel && def.itemLabels && (
            <>
              {section.items.length > 0 && (
                <ul className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {section.items.map((item) => (
                    <li key={item.id} className="group/item flex items-start gap-2 py-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          value={item.title}
                          onChange={(e) => patchItem(item.id, { title: e.target.value })}
                          aria-label={def.itemLabels![0]}
                          placeholder={def.itemLabels![0]}
                          className="h-9 font-medium"
                        />
                        <Input
                          value={item.detail}
                          onChange={(e) => patchItem(item.id, { detail: e.target.value })}
                          aria-label={def.itemLabels![1]}
                          placeholder={def.itemLabels![1]}
                          className="h-9"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${def.itemLabels![0].toLowerCase()}`}
                        className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover/item:opacity-100"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={addItem}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] hover:underline"
              >
                <Plus className="size-4" aria-hidden />
                {def.addLabel}
              </button>
            </>
          )}
        </div>

        <button
          onClick={onRemove}
          aria-label={`Remove ${section.title || "section"}`}
          className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover/section:opacity-100"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

/** The one authoring control on the page: what else to put on it. */
function AddSection({
  hasAbout,
  onAdd,
}: {
  hasAbout: boolean;
  onAdd: (kind: SectionKind) => void;
}) {
  const [open, setOpen] = useState(false);

  const options: SectionKind[] = [
    ...(hasAbout ? [] : (["about"] as SectionKind[])),
    "events",
    "faqs",
    "text",
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-input)] py-3 text-[14px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <Plus className="size-4" aria-hidden />
        Add a section
      </button>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-input)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--color-muted-foreground)]">
          Add a section
        </p>
        <button
          onClick={() => setOpen(false)}
          aria-label="Cancel"
          className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((kind) => (
          <Button
            key={kind}
            variant="outline"
            size="compact"
            onClick={() => {
              onAdd(kind);
              setOpen(false);
            }}
          >
            {SECTION_DEFS[kind].icon}
            {kind === "text" ? "Text section" : SECTION_DEFS[kind].title}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Shared by the rail's resource list — kept here so the page's authoring
 * affordances read the same wherever they appear. */
export function DashedEmptyState({
  message,
  actionLabel,
  onAction,
  className,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-dashed border-[var(--color-input)] p-4 text-center",
        className,
      )}
    >
      <p className="text-[13px] leading-snug text-[var(--color-muted-foreground)]">{message}</p>
      <Button variant="outline" size="compact" className="mt-2.5" onClick={onAction}>
        <Plus aria-hidden />
        {actionLabel}
      </Button>
    </div>
  );
}
