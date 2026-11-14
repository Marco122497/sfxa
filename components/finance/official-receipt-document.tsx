"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PrinterIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatAppFooterLabel } from "@/lib/app-meta";
import { formatDate } from "@/lib/format";

export type OfficialReceipt = {
  orNumber: string;
  date: string;
  receivedFrom: string;
  particulars: string;
  amount: string;
  schedule?: string | null;
  priest?: string | null;
};

function OfficialReceiptSheet({ receipt }: { receipt: OfficialReceipt }) {
  const printed = formatDate(new Date().toISOString().slice(0, 10));

  return (
    <article className="official-receipt-preview formal-report mx-auto bg-white text-[#111111]">
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-[17px] font-bold tracking-[0.02em] text-[#111111] uppercase">
            Saint Francis Xavier Parish
          </p>
          <p className="mt-1 text-[12px] italic text-[#374151]">
            Stewardship in faith; transparency in service
          </p>
          <p className="mt-1 text-[11px] text-[#4b5563]">
            SXFP Finance · Parish Financial Management
          </p>
        </div>
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden">
          <Image
            src="/SFXA.png"
            alt="Saint Francis Xavier Parish"
            width={64}
            height={64}
            className="size-full object-contain"
          />
        </div>
      </header>

      <p className="mt-8 text-right font-[family-name:var(--font-display)] text-[28px] font-bold tracking-[0.14em] text-[#111111] uppercase">
        Receipt
      </p>

      <dl className="mt-6 grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-6 gap-y-2 border-y border-[#111111] py-4 text-[13px]">
        <dt className="font-semibold text-[#111111]">Received from</dt>
        <dd className="min-w-0">{receipt.receivedFrom}</dd>
        <dt className="font-semibold text-[#111111]">Payment</dt>
        <dd>Walk-in cash</dd>
        <dt className="font-semibold text-[#111111]">OR No.</dt>
        <dd className="tabular-nums">{receipt.orNumber}</dd>
        <dt className="font-semibold text-[#111111]">Receipt date</dt>
        <dd>{receipt.date}</dd>
        {receipt.schedule ? (
          <>
            <dt className="font-semibold text-[#111111]">Schedule</dt>
            <dd>{receipt.schedule}</dd>
          </>
        ) : null}
        {receipt.priest ? (
          <>
            <dt className="font-semibold text-[#111111]">Priest</dt>
            <dd>{receipt.priest}</dd>
          </>
        ) : null}
      </dl>

      <table className="mt-6 w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[#111111]">
            <th className="w-16 py-2 pr-4 text-left text-[10px] font-semibold tracking-[0.14em] text-[#111111] uppercase">
              Qty
            </th>
            <th className="py-2 pr-4 text-left text-[10px] font-semibold tracking-[0.14em] text-[#111111] uppercase">
              Description
            </th>
            <th className="w-36 py-2 pr-4 text-right text-[10px] font-semibold tracking-[0.14em] text-[#111111] uppercase">
              Unit Price
            </th>
            <th className="w-36 py-2 text-right text-[10px] font-semibold tracking-[0.14em] text-[#111111] uppercase">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#e5e7eb]">
            <td className="py-3 pr-4 align-top">1</td>
            <td className="py-3 pr-4 align-top">{receipt.particulars}</td>
            <td className="py-3 pr-4 text-right align-top tabular-nums">
              {receipt.amount}
            </td>
            <td className="py-3 text-right align-top tabular-nums">
              {receipt.amount}
            </td>
          </tr>
          <tr className="border-b border-[#111111] bg-[#f3f4f6] font-semibold">
            <td className="py-2" />
            <td className="py-2" />
            <td className="py-2 pr-4 text-right">Amount received</td>
            <td className="py-2 text-right tabular-nums">{receipt.amount}</td>
          </tr>
        </tbody>
      </table>

      <section className="report-keep mt-10">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111111] uppercase">
          Notes
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">
          Walk-in cash payment recorded under official receipt {receipt.orNumber}.
          Please keep this receipt for parish records.
        </p>
        <p className="mt-4 text-[12px] text-[#4b5563]">
          Printed {printed}. {formatAppFooterLabel()}.
        </p>
      </section>

      <section className="report-keep mt-10 grid grid-cols-2 gap-16">
        <div className="text-sm">
          <p className="text-[10px] font-medium tracking-[0.16em] text-[#6b7280] uppercase">
            Prepared by
          </p>
          <div className="mt-10 border-b border-[#111111]" />
          <p className="mt-2 font-medium uppercase">Treasurer</p>
          <p className="text-[12px] uppercase text-[#4b5563]">Walk-in cash</p>
          <p className="mt-1 text-[12px] text-[#4b5563]">Date: {printed}</p>
        </div>
        <div className="text-sm">
          <p className="text-[10px] font-medium tracking-[0.16em] text-[#6b7280] uppercase">
            Noted by
          </p>
          <div className="mt-10 border-b border-[#111111]" />
          <p className="mt-2 font-medium uppercase">Parish Priest</p>
          <p className="text-[12px] uppercase text-[#4b5563]">Parish Priest</p>
          <p className="mt-1 text-[12px] text-[#4b5563]">Date: __________</p>
        </div>
      </section>
    </article>
  );
}

function printOfficialReceipt(receipt: OfficialReceipt) {
  document.documentElement.classList.add("printing-official-receipt");
  const previousTitle = document.title;
  document.title = `SXFP Official Receipt ${receipt.orNumber}`;

  const cleanup = () => {
    document.documentElement.classList.remove("printing-official-receipt");
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}

export function PrintOfficialReceiptButton({
  receipt,
}: {
  receipt: OfficialReceipt | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) return;
    document.documentElement.classList.remove("printing-official-receipt");
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="print:hidden"
        aria-label={
          receipt
            ? `View official receipt ${receipt.orNumber}`
            : "No official receipt number"
        }
        disabled={!receipt}
        onClick={() => setOpen(true)}
      >
        <PrinterIcon />
      </Button>
      <AlertDialog open={open && Boolean(receipt)} onOpenChange={setOpen}>
        <AlertDialogContent className="flex max-h-[min(92vh,920px)] w-full max-w-4xl flex-col gap-3 overflow-hidden bg-[#e5e7eb] sm:max-w-4xl">
          {receipt ? (
            <>
              <div className="flex items-center justify-between gap-3 print:hidden">
                <AlertDialogTitle className="text-sm font-medium text-[#111111]">
                  Official Receipt {receipt.orNumber}
                </AlertDialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => printOfficialReceipt(receipt)}
                  >
                    <PrinterIcon />
                    Print
                  </Button>
                  <AlertDialogCancel>
                    <XIcon />
                    Close
                  </AlertDialogCancel>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <OfficialReceiptSheet receipt={receipt} />
              </div>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
