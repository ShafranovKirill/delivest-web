export type LegalBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; items: string[] }

const HEADING = /^##\s+/
const LIST_ITEM = /^-\s+/

function toBlock(chunk: string[]): LegalBlock {
  const [first = ''] = chunk
  if (chunk.length === 1 && HEADING.test(first)) {
    return { type: 'heading', text: first.replace(HEADING, '') }
  }
  if (chunk.every((line) => LIST_ITEM.test(line))) {
    return { type: 'list', items: chunk.map((line) => line.replace(LIST_ITEM, '')) }
  }
  return { type: 'paragraph', lines: chunk }
}

export function parseLegalText(body: string): LegalBlock[] {
  return body
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) =>
      chunk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((chunk) => chunk.length > 0)
    .map(toBlock)
}
