"use client";

import { useRouter } from "next/navigation";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 25, 50, 100] as const;

export function AuditPagination({
  tab,
  page,
  pageSize,
  totalItems,
}: {
  tab: string;
  page: number;
  pageSize: number;
  totalItems: number;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const canPrevious = currentPage > 1;
  const canNext = currentPage < totalPages;
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  function hrefFor(nextPage: number, nextSize = pageSize) {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("page", String(nextPage));
    params.set("perPage", String(nextSize));
    return `/administrator/audit?${params.toString()}`;
  }

  function goTo(nextPage: number, nextSize = pageSize) {
    router.push(hrefFor(nextPage, nextSize));
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Field orientation="horizontal" className="w-fit">
          <FieldLabel htmlFor="audit-rows-per-page">Rows per page</FieldLabel>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              if (value == null) return;
              goTo(1, Number(value));
            }}
          >
            <SelectTrigger className="w-20" id="audit-rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <p className="text-sm text-muted-foreground">
          {totalItems === 0
            ? "No results"
            : `Showing ${from}–${to} of ${totalItems}`}
        </p>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={canPrevious ? hrefFor(currentPage - 1) : "#"}
              aria-disabled={!canPrevious}
              className={cn(!canPrevious && "pointer-events-none opacity-50")}
              onClick={(event) => {
                event.preventDefault();
                if (canPrevious) goTo(currentPage - 1);
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="flex h-8 items-center px-2 text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href={canNext ? hrefFor(currentPage + 1) : "#"}
              aria-disabled={!canNext}
              className={cn(!canNext && "pointer-events-none opacity-50")}
              onClick={(event) => {
                event.preventDefault();
                if (canNext) goTo(currentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
