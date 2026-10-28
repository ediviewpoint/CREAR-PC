import type { HardwareKind } from "@/components/icons";

/** Original category studies. These deliberately do not depict a specific model. */
export function HardwareStudy({ category }: { category: HardwareKind }) {
  return (
    <svg className="hardware-study" viewBox="0 0 320 240" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        {category === "cpu" && (
          <>
            <path d="m160 36 93 45v79l-93 44-93-44V81z" fill="#f7f8fa" />
            <path d="m67 81 93 44 93-44M160 125v79m-93-57 93 44 93-44" />
            <path d="m160 53 66 32-66 32-66-32z" fill="#eef1f5" />
            <path d="m160 63 45 22-45 22-45-22zM125 142v23m9-19v23m9-19v23m34-23v23m9-27v23m9-27v23" />
          </>
        )}
        {category === "mobo" && (
          <>
            <rect x="85" y="23" width="150" height="194" rx="4" fill="#f7f8fa" />
            <rect x="114" y="63" width="57" height="57" rx="3" fill="#eef1f5" />
            <path d="M122 71h41v41h-41zM94 33h22v65H94zM182 39h10v98h-10zm17 0h10v98h-10zM110 150h105v9H110zm0 20h105v9H110zM94 192h49v13H94zM157 192h59v13h-59zM113 131h49m-49 6h49M218 40v88" />
            {[
              [94, 32],
              [226, 32],
              [94, 208],
              [226, 208],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" />
            ))}
          </>
        )}
        {category === "ram" && (
          <>
            <path d="m44 96 211-34 24 73-211 34z" fill="#eef1f5" />
            <path d="m44 96 7 19 211-34M68 169l4 11 93-15 2-7 8-1 3 6 105-17-4-11" />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`m${68 + i * 34} 119 23-4 9 27-23 4z`} />
            ))}
            <path d="m60 104 190-30M82 172l-2-8m14 6-2-8m14 6-2-8m14 6-2-8m14 6-2-8m14 6-2-8m45 1-2-8m14 6-2-8m14 6-2-8m14 6-2-8m14 6-2-8m14 6-2-8" />
          </>
        )}
        {category === "gpu" && (
          <>
            <path d="m39 83 230-13 14 81-230 14z" fill="#f7f8fa" />
            <path d="m53 165 4 13 229-15-3-12M39 83l-7 1v101h18M64 173l4 15 73-5-3-14M177 168l2 11 42-2-2-12" />
            {[107, 218].map((cx) => (
              <g key={cx}>
                <ellipse cx={cx} cy="119" rx="35" ry="33" fill="#eef1f5" />
                <circle cx={cx} cy="119" r="8" />
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <path
                    key={angle}
                    transform={`rotate(${angle} ${cx} 119)`}
                    d={`M${cx + 7} 116q24-14 17-20q-8-5-20 16`}
                  />
                ))}
              </g>
            ))}
          </>
        )}
        {category === "storage" && (
          <>
            <path d="m39 113 235-40 12 61-235 40z" fill="#eef1f5" />
            <path d="m51 174 2 6 235-40-2-6M44 122l8 41m-3-43 8 41m-3-42 8 41" />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`m${82 + i * 55} ${117 - i * 9} 39-7 6 32-39 7z`} fill="#f7f8fa" />
            ))}
            <circle cx="266" cy="108" r="5" />
          </>
        )}
        {category === "psu" && (
          <>
            <path d="m74 74 139-33 40 42v109l-139 24-40-42z" fill="#f7f8fa" />
            <path d="m74 74 40 42 139-33M114 116v100M213 41v42" />
            <ellipse
              cx="184"
              cy="148"
              rx="45"
              ry="37"
              transform="rotate(-10 184 148)"
              fill="#eef1f5"
            />
            {[16, 25, 34].map((r) => (
              <ellipse
                key={r}
                cx="184"
                cy="148"
                rx={r + 8}
                ry={r}
                transform="rotate(-10 184 148)"
              />
            ))}
            <path d="m81 101 23 24v19l-23-24zm3 43 17 18v17l-17-18M119 126l128-23M120 197l128-23" />
          </>
        )}
        {category === "case" && (
          <>
            <path d="m99 38 95-17 43 28v155l-95 21-43-30z" fill="#f7f8fa" />
            <path d="m99 38 43 28 95-17M142 66v159M110 59l22 14v128l-22-14zM155 84l69-14v118l-69 16z" />
            <path d="m166 103 43-9v59l-43 9zM161 181l56-12m-49-3 41-9M154 56l32-6m14-3 9-2M108 201v8m111-1v8" />
            <ellipse cx="188" cy="129" rx="13" ry="18" />
          </>
        )}
        {category === "cooler" && (
          <>
            <path d="m87 53 109-23 41 30v123l-109 26-41-30z" fill="#f7f8fa" />
            <path d="m87 53 41 30 109-23M128 83v126" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <path key={i} d={`m88 ${65 + i * 14} 39 29m3 0 106-25`} />
            ))}
            <path d="m142 91 81-19v98l-81 19z" fill="#eef1f5" />
            <ellipse cx="183" cy="131" rx="29" ry="40" />
            <ellipse cx="183" cy="131" rx="7" ry="10" />
            <path d="M183 121q-28-22-20-13m27 20q25-34 14-31m-22 44q-24 35-19 14m27-19q29 19 15 23M143 200v18m13-21v18m31-25v18m13-21v18" />
          </>
        )}
      </g>
    </svg>
  );
}
