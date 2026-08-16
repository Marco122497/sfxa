export type ParishContentKind = "activity" | "notice";

const PREFIX: Record<ParishContentKind, string> = {
  activity: "[ACTIVITY] ",
  notice: "[NOTICE] ",
};

export function encodeParishTitle(kind: ParishContentKind, title: string) {
  const clean = stripParishPrefix(title);
  return `${PREFIX[kind]}${clean}`;
}

export function stripParishPrefix(title: string) {
  return title.replace(/^\[(ACTIVITY|NOTICE)\]\s*/i, "").trim();
}

export function parishContentKind(title: string): ParishContentKind {
  if (/^\[ACTIVITY\]/i.test(title)) return "activity";
  return "notice";
}

export function isParishContentKind(
  title: string,
  kind: ParishContentKind
) {
  return parishContentKind(title) === kind;
}
