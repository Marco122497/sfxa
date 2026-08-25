"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportExportButtons({
  title,
}: {
  filename?: string;
  rows?: string[][];
  title: string;
}) {
  function printReport() {
    const previousTitle = document.title;
    document.title = title;
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="print:hidden">
      <Button type="button" onClick={printReport}>
        <PrinterIcon />
        Print
      </Button>
    </div>
  );
}
