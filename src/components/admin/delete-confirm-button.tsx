"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  entityType: string;
  hiddenFieldName: string;
  hiddenFieldValue: string;
  action: (formData: FormData) => Promise<void>;
  extraWarning?: string;
}

export function DeleteConfirmButton({
  name,
  entityType,
  hiddenFieldName,
  hiddenFieldValue,
  action,
  extraWarning,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    const lines = [
      `Delete ${entityType} "${name}"?`,
      "",
      ...(extraWarning ? [extraWarning, ""] : []),
      "This cannot be undone.",
    ];

    if (window.confirm(lines.join("\n"))) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name={hiddenFieldName} value={hiddenFieldValue} />
      <Button variant="destructive" size="sm" type="button" onClick={handleClick}>
        Delete
      </Button>
    </form>
  );
}
