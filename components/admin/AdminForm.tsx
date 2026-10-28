"use client";
import { useActionState } from "react";
import type { ReactNode } from "react";
import type { AdminState } from "@/app/_actions/admin";
export function AdminForm({
  action,
  children,
  label = "Guardar",
}: {
  action: (state: AdminState, form: FormData) => Promise<AdminState>;
  children: ReactNode;
  label?: string;
}) {
  const [state, submit, pending] = useActionState(action, { message: "" });
  return (
    <form action={submit} className="admin-form">
      <fieldset disabled={pending}>
        {children}
        <button className="button" type="submit">
          {pending ? "Guardando…" : label}
        </button>
      </fieldset>
      {state.message && <p role="status">{state.message}</p>}
    </form>
  );
}
