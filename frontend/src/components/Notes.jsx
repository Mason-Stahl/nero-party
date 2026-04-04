/**
 * Notes — SVG staff queue visualization
 *
 * Per song:
 *   - Beam/stems rendered first, then rects + text on top
 *   - Title marquees continuously (two text copies, seamless loop)
 *   - Always-on for song 1, hover-triggered for rest
 *   - Hover area spans full height (noteheads → bottom of channel rect)
 */

import { useState } from "react";

const SVG_H    = 140;
const SLOT_W   = 144;
const RECT_W   = 102;
const RECT_H   = 15;
const CHAN_H   = 13;
const RECT_GAP = 2;
const NRX      = 5.5;
const NRY      = 3.8;
const STEM_H   = 62;
const CHAR_W   = 5.2;   // approx px per char at fontSize=9
const PAD      = 6;     // horizontal padding inside title rect
const LOOP_GAP = 24;    // gap between the two text copies in the loop

const STAFF_Y   = [72, 84, 96, 108];
const NOTE_LINE = [84, 96];

const GREEN    = "rgb(34,197,94)";
const WHITE    = "rgb(255,255,255)";
const DIM      = "rgba(255,255,255,0.20)";
const RECT_DIM = "rgb(255,255,255)";

function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max - 1) + "…" : (str ?? "");
}

export default function Notes({ songs = [] }) {
  const [hoveredId, setHoveredId] = useState(null);
  if (!songs.length) return null;

  const svgW = songs.length * SLOT_W + 24;

  return (
    <svg width={svgW} height={SVG_H} style={{ display: "block", overflow: "visible" }}>

      {/* Staff lines */}
      {STAFF_Y.map((y) => (
        <line key={y} x1={0} y1={y} x2={svgW} y2={y}
          stroke={DIM} strokeWidth={1} />
      ))}

      {songs.map((song, i) => {
        const isNext   = i === 0;
        const noteFill = isNext ? GREEN : WHITE;
        const rectFill = isNext ? GREEN : RECT_DIM;
        const textFill = "#000";

        const rectX = i * SLOT_W + 12;
        const noteY = NOTE_LINE[i % 2];
        const beamY = noteY - STEM_H;
        const rectY = beamY - RECT_H / 2;

        const cx1  = rectX;
        const cx2  = rectX + RECT_W;
        const sx1  = cx1 + NRX;
        const sx2  = cx2 + NRX;
        const midX = rectX + RECT_W / 2;

        const chanY    = rectY + RECT_H + RECT_GAP;
        const fullTitle = song.title ?? "";
        const channel   = truncate(song.artist ?? song.addedBy?.displayName, 18);

        // Hover area: from top of title rect down to bottom of channel rect
        const hoverTop = rectY;
        const hoverH   = RECT_H + RECT_GAP + CHAN_H;

        const textW        = fullTitle.length * CHAR_W;
        const innerW       = RECT_W - PAD * 2;
        const overflows    = textW > innerW;
        const shouldScroll = (isNext || hoveredId === song.id) && overflows;
        const loopW        = textW + LOOP_GAP;
        const dur          = `${(loopW / 30).toFixed(1)}s`; // speed: ~30px/s

        const clipId = `ct-${i}`;

        return (
          <g key={song.id}>

            <defs>
              <clipPath id={clipId}>
                <rect x={rectX + PAD} y={rectY - 1} width={RECT_W - PAD * 2} height={RECT_H + 2} />
              </clipPath>
            </defs>

            {/* ── Draw beam + stems + noteheads FIRST so rects paint over them ── */}

            {/* Beam */}
            <line x1={sx1-4} y1={beamY} x2={sx2-7} y2={beamY}
              stroke={noteFill} strokeWidth={isNext ? 2.5 : 1.5} />

            {/* Stems */}
            <line x1={sx1-4} y1={noteY - NRY+4} x2={sx1-4} y2={rectY}
              stroke={noteFill} strokeWidth={2.5} />
            <line x1={sx2-7} y1={noteY - NRY+4} x2={sx2-7} y2={rectY}
              stroke={noteFill} strokeWidth={2.5} />

            {/* Noteheads */}
            <ellipse cx={cx1-3} cy={noteY} rx={NRX} ry={NRY} fill={noteFill} />
            <ellipse cx={cx2-6} cy={noteY} rx={NRX} ry={NRY} fill={noteFill} />

            {/* ── Rects + text on top ── */}

            {/* Title rect */}
            <rect x={rectX} y={rectY} width={RECT_W} height={RECT_H} rx={4} fill={rectFill} />

            {/* Title text — clipped, continuous loop marquee when overflows */}
            <g clipPath={`url(#${clipId})`}>
              <g>
                {shouldScroll && (
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0,0; ${-loopW},0`}
                    keyTimes="0; 1"
                    dur={dur}
                    repeatCount="indefinite"
                  />
                )}
                {/* First copy */}
                <text
                  x={rectX + PAD} y={rectY + RECT_H * 0.72}
                  fontSize={9} fontWeight={700}
                  fill={textFill} fontFamily="inherit"
                  style={{ userSelect: "none" }}
                >
                  {fullTitle}
                </text>
                {/* Second copy for seamless loop */}
                {shouldScroll && (
                  <text
                    x={rectX + PAD + loopW} y={rectY + RECT_H * 0.72}
                    fontSize={9} fontWeight={700}
                    fill={textFill} fontFamily="inherit"
                    style={{ userSelect: "none" }}
                  >
                    {fullTitle}
                  </text>
                )}
              </g>
            </g>

            {/* Channel rect */}
            <rect
              x={rectX} y={chanY}
              width={RECT_W} height={CHAN_H}
              rx={4} fill={rectFill} fillOpacity={0.8}
            />

            {/* Channel text */}
            <text
              x={midX} y={chanY + CHAN_H * 0.72}
              textAnchor="middle"
              fontSize={8} fontWeight={500}
              fill={textFill} fontFamily="inherit"
              style={{ userSelect: "none" }}
            >
              {channel}
            </text>

            {/* ── Hover area — full height from title rect to channel rect bottom ── */}
            <rect
              x={rectX} y={hoverTop}
              width={RECT_W} height={hoverH}
              fill="transparent"
              onMouseEnter={() => setHoveredId(song.id)}
              onMouseLeave={() => setHoveredId(null)}
            />

          </g>
        );
      })}
    </svg>
  );
}
