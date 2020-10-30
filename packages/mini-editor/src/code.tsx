import React from "react"
import { codeDiff, CodeLine } from "@code-hike/code-diff"
import { SmoothLines } from "@code-hike/smooth-lines"
import { useDimensions } from "./use-dimensions"
import {
  getFocusExtremes,
  parseFocus,
} from "./focus-parser"

type CodeProps = {
  prevCode: string
  prevFocus: string | null
  nextCode: string
  nextFocus: string | null
  progress: number
  language: string
}

export function Code({
  prevCode,
  prevFocus,
  nextCode,
  nextFocus,
  progress,
  language,
}: CodeProps) {
  const { prevKeys, nextKeys, codeMap } = codeDiff({
    prevCode,
    nextCode,
    lang: language,
  })

  const [ref, dimensions] = useDimensions<HTMLPreElement>()

  const prevLines = prevKeys.map(key => ({
    key,
    element: <Line line={codeMap[key]} />,
  }))

  const prevFocusPair = getFocusExtremes(
    prevFocus,
    prevLines
  )

  const nextLines = nextKeys.map(key => ({
    key,
    element: <Line line={codeMap[key]} />,
  }))

  const nextFocusPair = getFocusExtremes(
    nextFocus,
    nextLines
  )

  return (
    <pre
      ref={ref}
      className={`language-${language}`}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        padding: 0,
        margin: 0,
        overflow: "hidden",
      }}
    >
      {dimensions ? (
        <code>
          <SmoothLines
            center={false}
            progress={progress}
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
            prevLines={prevLines}
            nextLines={nextLines}
            lineHeight={20}
            lineWidth={150}
            prevFocus={prevFocusPair}
            nextFocus={nextFocusPair}
            maxZoom={1}
          />
        </code>
      ) : (
        "..."
      )}
    </pre>
  )
}

function Line({ line }: { line: CodeLine }) {
  return (
    <div
      style={{
        height: 20,
        width: 150,
        boxSizing: "border-box",
        outline: "green 1px solid",
        padding: "0 4px",
      }}
    >
      {line.map(([token, type], i) => (
        <span className={`token ${type}`} key={i + 1}>
          {token}
        </span>
      ))}
    </div>
  )
}
