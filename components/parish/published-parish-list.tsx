import { formatDateTime } from "@/lib/auth/roles";
import { stripParishPrefix } from "@/lib/parish-content";

export type PublishedParishItem = {
  announcement_id: number;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
};

export function PublishedParishList({
  items,
  emptyMessage,
}: {
  items: PublishedParishItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.announcement_id}>
          <p className="font-medium">{stripParishPrefix(item.title)}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(item.published_at ?? item.created_at)}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {item.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
