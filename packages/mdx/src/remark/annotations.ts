import { Code, relativeToAbsolute } from "../utils"
import { CodeAnnotation } from "../smooth-code"
import { wrapChildren } from "./to-estree"
import { annotationsMap } from "../mdx-client/annotations"
import { JsxNode as JsxNode, SuperNode } from "./nodes"
import { getCommentData } from "./comment-data"
import { CodeHikeConfig } from "./config"

export function getAnnotationsFromMetastring(
  options: Record<string, string>
) {
  const annotations = [] as CodeAnnotation[]
  Object.keys(options).forEach(key => {
    const Component = annotationsMap[key]
    if (Component) {
      annotations?.push({ focus: options[key], Component })
    }
  })
  return annotations
}

export function extractAnnotationsFromCode(
  code: Code,
  config: CodeHikeConfig
) {
  const { lines } = code
  let lineNumber = 1
  const annotations = [] as CodeAnnotation[]
  const focusList = [] as string[]
  while (lineNumber <= lines.length) {
    const line = lines[lineNumber - 1]
    const { key, focusString, data } = getCommentData(
      line,
      code.lang
    )

    const Component = annotationsMap[key!]

    if (Component) {
      const focus = relativeToAbsolute(
        focusString,
        lineNumber
      )
      lines.splice(lineNumber - 1, 1)
      annotations.push({ Component, focus, data })
    } else if (key === "focus") {
      const focus = relativeToAbsolute(
        focusString,
        lineNumber
      )
      lines.splice(lineNumber - 1, 1)
      focusList.push(focus)
    } else {
      lineNumber++
    }
  }

  // extract links
  if (config.autoLink) {
    lineNumber = 1
    while (lineNumber <= lines.length) {
      const line = lines[lineNumber - 1]
      const lineContent = line.tokens
        .map(t => t.content)
        .join("")

      const urls = extractURLsFromLine(lineContent)
      urls.forEach(({ url, start, end }) => {
        const Component = annotationsMap["link"]
        const focus = `${lineNumber}[${start + 1}:${end}]`
        annotations.push({
          Component,
          focus,
          data: url,
        })
      })
      lineNumber++
    }
  }
  return [annotations, focusList.join(",")] as const
}

const urlRegex = /https?:\/\/[\w\-_.~:/?#[\]@!$&*+,;=%]+/g
function extractURLsFromLine(line: string) {
  const urls = []
  let match: RegExpExecArray | null

  while ((match = urlRegex.exec(line)) !== null) {
    const url = match[0]
    const start = match.index
    const end = start + url.length

    urls.push({ url, start, end })
  }

  return urls
}

export function extractJSXAnnotations(
  node: SuperNode,
  index: number,
  parent: SuperNode
) {
  const annotations = [] as CodeAnnotation[]

  const nextIndex = index + 1
  while (
    parent.children[nextIndex] &&
    parent.children[nextIndex].type ===
      "mdxJsxFlowElement" &&
    (parent.children[nextIndex] as JsxNode).name ===
      "CH.Annotation"
  ) {
    const jsxAnnotation = parent.children[nextIndex] as any

    // copy attributes to props
    const props = {} as any
    jsxAnnotation.attributes.forEach((attr: any) => {
      props[attr.name] = attr.value
    })
    const { as, focus, ...data } = props
    data.children = wrapChildren(
      jsxAnnotation.children || []
    )

    const Component = annotationsMap[as] || as
    annotations.push({
      Component,
      focus,
      data: isEmpty(data) ? undefined : data,
    })
    parent.children.splice(nextIndex, 1)
  }
  return annotations
}

function isEmpty(obj: any) {
  return Object.keys(obj).length === 0
}
