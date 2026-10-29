"use client";
import { useEffect, useRef } from "react";
function clean(value: string) {
  const doc = new DOMParser().parseFromString(value, "text/html");
  for (const el of [...doc.body.querySelectorAll("*")]) {
    if (!["P", "STRONG", "EM", "UL", "OL", "LI", "A", "BR"].includes(el.tagName)) {
      el.replaceWith(...el.childNodes);
      continue;
    }
    for (const attr of [...el.attributes])
      if (!(el.tagName === "A" && attr.name === "href" && /^https?:\/\//i.test(attr.value)))
        el.removeAttribute(attr.name);
    if (el.tagName === "A") el.setAttribute("rel", "noopener noreferrer");
  }
  return doc.body.innerHTML;
}
export function DescripcionEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerHTML !== value)
      ref.current.innerHTML = clean(value);
  }, [value]);
  function format(tag: "strong" | "em" | "ul" | "a") {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !ref.current?.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    const wrapper = document.createElement(tag);
    if (tag === "a") {
      const url = window.prompt("Enlace https://");
      if (!url || !/^https?:\/\//i.test(url)) return;
      wrapper.setAttribute("href", url);
      wrapper.setAttribute("rel", "noopener noreferrer");
    }
    if (tag === "ul") {
      const li = document.createElement("li");
      li.appendChild(range.extractContents());
      wrapper.appendChild(li);
    } else wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    range.selectNodeContents(wrapper);
    selection.addRange(range);
    onChange(ref.current.innerHTML);
  }
  return (
    <div>
      <div className="elite-toolbar">
        {(
          [
            ["strong", "Negrita"],
            ["em", "Cursiva"],
            ["ul", "Lista"],
            ["a", "Enlace"],
          ] as const
        ).map(([tag, label]) => (
          <button
            type="button"
            key={tag}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format(tag)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-label="Descripción"
        aria-multiline="true"
        className="elite-rich-text"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          const range = window.getSelection()?.getRangeAt(0);
          if (range) {
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            onChange(event.currentTarget.innerHTML);
          }
        }}
      />
    </div>
  );
}
