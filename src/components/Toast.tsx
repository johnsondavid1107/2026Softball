"use client";

import { useEffect } from "react";
import clsx from "clsx";

export type ToastData = {
  id: number;
  message: string;
  kind: "error" | "success";
};

type Props = {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
};

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: number) => void;
}) {
  // Auto-dismiss after 4 seconds.
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={clsx(
        "pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-left text-[14px] font-semibold shadow-card-lg",
        toast.kind === "error"
          ? "bg-red-600 text-white"
          : "bg-team-green text-team-gold"
      )}
    >
      {toast.message}
    </button>
  );
}
