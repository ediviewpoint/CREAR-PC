"use client";
import { useActionState, useRef, useState, useTransition } from "react";
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

/** Mutation forms retain entered values when validation or the network fails. */
export function AdminMutationForm({
  action,
  children,
  label = "Guardar",
}: {
  action: (state: AdminState, form: FormData) => Promise<AdminState>;
  children: ReactNode;
  label?: string;
}) {
  const [state, setState] = useState<AdminState>({ message: "" });
  const [pending, start] = useTransition();
  const running = useRef(false);
  return (
    <form
      className="admin-form"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (running.current) return;
        running.current = true;
        const data = new FormData(event.currentTarget);
        start(async () => {
          try {
            setState(await action(state, data));
          } catch {
            setState({
              message: "No se pudo conectar. Los datos siguen en el formulario; volvé a intentar.",
            });
          } finally {
            running.current = false;
          }
        });
      }}
    >
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
