import React from "react"
import { useDimensions, Dimensions } from "./use-dimensions"
import { IRawTheme } from "vscode-textmate"
import {
  FullTween,
  Code,
  map,
  FocusString,
  getCodeColors,
  getColor,
  ColorName,
  getColorScheme,
  anyValue,
} from "../utils"
import {
  useStepParser,
  CodeAnnotation,
  CodeShift,
} from "./partial-step-parser"
import { SmoothLines } from "./smooth-lines"
import { CopyButton } from "./copy-button"

type HTMLProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

type TriggerPosition = `${number}px` | `${number}%`

export type CodeTweenProps = {
  tween: FullTween<CodeStep>
  progress: number
  config: CodeConfig
} & HTMLProps

export type CodeStep = {
  code: Code
  focus: FocusString
  annotations?: CodeAnnotation[]
}
export type CodeConfig = {
  /* not really the height, when this changes we measure everything again */
  parentHeight?: any
  minColumns?: number
  minZoom?: number
  maxZoom?: number
  horizontalCenter?: boolean
  theme: IRawTheme
  lineNumbers?: boolean
  showCopyButton?: boolean
  showExpandButton?: boolean
  staticMediaQuery?: string
  rows?: number | "focus" | (number | "focus")[]
  triggerPosition?: TriggerPosition
  debug?: boolean
}

function useCodeShift({
  tween,
  theme,
}: {
  tween: FullTween<CodeStep>
  theme: IRawTheme
}) {
  return useStepParser({
    highlightedLines: map(tween, tween => tween.code.lines),
    theme,
    focus: map(tween, tween => tween.focus),
    annotations: map(tween, tween => tween.annotations),
    lang: anyValue(tween, tween => tween?.code?.lang),
  })
}

const DEFAULT_MIN_COLUMNS = 10

export function CodeTween({
  tween,
  progress,
  config,
  ...preProps
}: CodeTweenProps) {
  const stepInfo = useCodeShift({
    tween,
    theme: config.theme,
  })

  const { element, dimensions } = useDimensions(
    stepInfo.code,
    map(tween, tween => tween.focus),
    config.minColumns || DEFAULT_MIN_COLUMNS,
    config.lineNumbers || false,
    config.rows as number | "focus",
    [config.parentHeight]
  )

  return !dimensions || config.debug ? (
    <BeforeDimensions
      element={element}
      htmlProps={preProps}
      debug={config.debug}
    />
  ) : (
    <AfterDimensions
      dimensions={dimensions}
      stepInfo={stepInfo}
      config={config}
      progress={progress}
      htmlProps={preProps}
    />
  )
}

function BeforeDimensions({
  element,
  htmlProps,
  debug,
}: {
  element: React.ReactNode
  htmlProps?: HTMLProps
  debug?: boolean
}) {
  return (
    <Wrapper
      htmlProps={htmlProps}
      style={{ opacity: debug ? 0.9 : 0, overflow: "auto" }}
    >
      {element}
    </Wrapper>
  )
}

function AfterDimensions({
  config: {
    minZoom = 1,
    maxZoom = 1,
    horizontalCenter = false,
    theme,
  },
  dimensions,
  stepInfo,
  progress,
  htmlProps,
  config,
}: {
  dimensions: NonNullable<Dimensions>
  stepInfo: CodeShift
  config: CodeConfig
  progress: number
  htmlProps: HTMLProps
}) {
  const { bg, fg } = getCodeColors(theme)

  return (
    <Wrapper
      htmlProps={htmlProps}
      style={{
        opacity: 1,
        backgroundColor: bg,
        color: fg,
        ["colorScheme" as any]: getColorScheme(theme),
        ["--ch-selection-background" as any]: getColor(
          theme,
          ColorName.SelectionBackground
        ),
      }}
    >
      <SmoothLines
        codeStep={stepInfo}
        progress={progress}
        dimensions={dimensions}
        // TODO move to dimensions?
        minZoom={minZoom}
        maxZoom={maxZoom}
        center={horizontalCenter}
        theme={theme}
      />
      {config.showCopyButton ? (
        <CopyButton
          className="ch-code-button"
          content={stepInfo?.code?.prev}
        />
      ) : undefined}
    </Wrapper>
  )
}

function Wrapper({
  htmlProps,
  style,
  children,
}: {
  htmlProps?: HTMLProps
  style: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div
      className="ch-code-wrapper"
      {...htmlProps}
      style={{
        margin: 0,
        padding: 0,
        position: "relative",
        // using this instead of <pre> because https://github.com/code-hike/codehike/issues/120
        whiteSpace: "pre",
        // to avoid resets using "border-box" that break the scrollbar https://github.com/code-hike/codehike/issues/240
        boxSizing: "content-box",
        ...style,
        ...htmlProps?.style,
      }}
      children={children}
    />
  )
}
