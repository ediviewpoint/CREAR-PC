import type { ReactNode } from "react";
import type { HardwareKind } from "@/components/icons";
const kinds: HardwareKind[] = ["case", "mobo", "cpu", "ram", "storage", "psu", "gpu", "cooler"];
export const CASE_PART_OFFSETS: Record<HardwareKind, [number, number]> = {
  case: [0, 0],
  mobo: [-46, -14],
  cpu: [-80, -42],
  ram: [40, -32],
  storage: [68, 14],
  psu: [-24, 36],
  gpu: [38, 38],
  cooler: [-96, -76],
};
export function CaseDrawing({
  label = "Chasis abierto, dibujo conceptual isométrico",
  populated = false,
  installed,
  active,
  exploded = false,
}: {
  label?: string;
  populated?: boolean;
  installed?: HardwareKind[];
  active?: HardwareKind;
  exploded?: boolean;
}) {
  const present = installed ?? (populated ? kinds : ["case"]);
  function part(kind: HardwareKind, children: ReactNode) {
    return (
      <g
        key={kind}
        className="case-part"
        data-part={kind}
        data-installed={present.includes(kind)}
        data-active={active === kind}
        style={{
          transform: exploded
            ? "translate(" +
              CASE_PART_OFFSETS[kind][0] +
              "px, " +
              CASE_PART_OFFSETS[kind][1] +
              "px)"
            : "translate(0px, 0px)",
        }}
      >
        {children}
      </g>
    );
  }
  return (
    <svg
      className="case-drawing"
      data-exploded={exploded}
      data-active-part={active}
      viewBox="0 0 560 500"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <ellipse className="case-drawing__ground" cx="287" cy="438" rx="200" ry="39" />
      <path className="case-drawing__ground" d="m76 397 222 71 205-106M75 407l223 71 204-106" />
      {part(
        "case",
        <>
          <path d="m142 105 210-57 74 49v287l-210 57-74-49Z" />
          <path d="m142 105 74 49 210-57M216 154v287M352 48v287l74 49" />
          <path d="m158 132 42 28v242l-42-28ZM222 420l195-53M152 385l59 39" />
          {[168, 248].map((y) => (
            <g key={y}>
              <ellipse cx="379" cy={y} rx="22" ry="32" />
              <ellipse cx="379" cy={y} rx="7" ry="10" />
              <path d={"m362 " + (y - 18) + " 34 36m-34-18h34m-17-28v56"} />
            </g>
          ))}
        </>,
      )}
      {part(
        "mobo",
        <>
          <path d="m231 174 102-27v167l-102 28Z" />
          <path d="m241 280 50-13m-50 20 50-13m-50 20 50-13M241 305l62-17" />
          <circle cx="240" cy="181" r="2" />
          <circle cx="325" cy="159" r="2" />
          <circle cx="240" cy="330" r="2" />
          <circle cx="325" cy="307" r="2" />
        </>,
      )}
      {part(
        "cpu",
        <>
          <path d="m253 192 38-10v37l-38 10Z" />
          <path d="m260 197 24-7v22l-24 7Z" />
          <path d="m257 187-3-6m15 3-2-6m15 2-2-6M257 231l2 6m10-9 2 6m10-9 2 6" />
        </>,
      )}
      {part(
        "ram",
        <>
          <path d="m304 181 7-2v66l-7 2ZM318 177l7-2v66l-7 2Z" />
          <path d="m306 192 3-1m-3 9 3-1m-3 9 3-1m11-21 3-1m-3 9 3-1m-3 9 3-1" />
        </>,
      )}
      {part(
        "storage",
        <>
          <path d="m248 309 58-16v13l-58 16Z" />
          <path d="m254 311 10-3v5l-10 3Zm16-4 10-3v5l-10 3Zm16-5 10-3v5l-10 3Z" />
        </>,
      )}
      {part(
        "psu",
        <>
          <path d="m235 384 71-19 57 35-71 19Zm0 0v24l57 35 71-19v-24M292 419v24" />
          <ellipse cx="292" cy="391" rx="20" ry="8" />
          <path d="m273 391h38m-27-5 16 10" />
        </>,
      )}
      {part(
        "gpu",
        <>
          <path d="m233 333 112-30 47 31-112 30Zm0 0v19l47 31 112-30v-19M280 364v19" />
          <ellipse cx="274" cy="342" rx="16" ry="7" />
          <ellipse cx="322" cy="329" rx="16" ry="7" />
          <path d="m264 340 18 4m-12-8 8 12m34-21 18 4m-12-8 8 12" />
        </>,
      )}
      {part(
        "cooler",
        <>
          <path d="m251 201 33-9 25 17-33 9Zm0 0v49l25 17 33-9v-49M276 218v49" />
          <path d="m256 210 15 10m-15-2 15 10m-15-2 15 10m-15-2 15 10m-15-2 15 10" />
          <ellipse cx="291" cy="238" rx="10" ry="16" />
          <path d="m286 228 10 20m-11-10h12" />
        </>,
      )}
      <g className="case-drawing__rulers">
        <path d="m118 111-28 8v275l28-8M86 119h8m-8 275h8m154 64 149-40" strokeDasharray="3 6" />
        <path d="m151 91 192-52M151 87v8m192-60v8" />
      </g>
    </svg>
  );
}
