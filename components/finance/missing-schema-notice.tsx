import { FileWarningIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MissingSchemaNotice({
  feature,
  detail,
  projectHost,
  script = "sql/phase3-categories.sql",
}: {
  feature: string;
  detail?: string | null;
  projectHost?: string | null;
  script?: string;
}) {
  return (
    <Alert>
      <FileWarningIcon />
      <AlertTitle>{feature} is not available</AlertTitle>
      <AlertDescription>
        <p>
          Run <code className="text-xs">{script}</code> in the Supabase SQL
          editor for the same project this app uses, then wait a few seconds
          and refresh.
        </p>
        {projectHost ? (
          <p className="mt-2">
            App project: <code className="text-xs">{projectHost}</code>
          </p>
        ) : null}
        {detail ? (
          <p className="mt-2 font-mono text-xs">{detail}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
