"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AUDIT_TABS,
  auditTabHref,
  type AuditTab,
} from "@/lib/admin/audit";

export function AuditTabs({ activeTab }: { activeTab: AuditTab }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<AuditTab | null>(null);

  useEffect(() => {
    setPendingTab(null);
  }, [activeTab]);

  useEffect(() => {
    for (const tab of AUDIT_TABS) {
      router.prefetch(auditTabHref(tab.id));
    }
  }, [router]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        const nextTab = value as AuditTab;
        if (nextTab === activeTab || isPending) return;

        setPendingTab(nextTab);
        startTransition(() => {
          router.push(auditTabHref(nextTab));
        });
      }}
      className="print:hidden"
    >
      <TabsList variant="line">
        {AUDIT_TABS.map((tab) => {
          const isLoading = isPending && pendingTab === tab.id;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              id={`audit-tab-${tab.id}`}
              aria-controls={`audit-panel-${tab.id}`}
              disabled={isPending}
            >
              {tab.label}
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
