import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

function indentLines(text: string, prefix: string, firstPrefix: string): string {
	return text
		.split('\n')
		.map((line, i) => (i === 0 ? firstPrefix : (line === '' ? '' : prefix)) + line)
		.join('\n')
}

function leafText(node: ProseMirrorNode): string {
	return node.type.name === 'hardBreak' ? '\n' : ''
}

function serializeListItem(item: ProseMirrorNode, marker: string): string {
	const body = serializeFragment(item.content, '\n')
	return indentLines(body, ' '.repeat(marker.length), marker)
}

function serializeNode(node: ProseMirrorNode): string {
	switch (node.type.name) {
		case 'bulletList':
		case 'orderedList':
		case 'taskList': {
			const start = (node.attrs.start as number | undefined) ?? 1
			const items: string[] = []
			node.forEach((item, _offset, index) => {
				let marker = '- '
				if (node.type.name === 'orderedList') {
					marker = `${start + index}. `
				} else if (node.type.name === 'taskList') {
					marker = item.attrs.checked ? '- [x] ' : '- [ ] '
				}
				items.push(serializeListItem(item, marker))
			})
			return items.join('\n')
		}
	}

	if (node.isLeaf) {
		return leafText(node)
	}

	if (node.isTextblock) {
		return node.textBetween(0, node.content.size, '\n', leafText)
	}

	return serializeFragment(node.content, '\n\n')
}

function serializeFragment(fragment: Fragment, separator: string): string {
	const blocks: string[] = []
	fragment.forEach(node => {
		blocks.push(serializeNode(node))
	})
	return blocks.join(separator)
}

/**
 * Plain text for the clipboard which keeps list markers, unlike ProseMirror's default.
 */
export function clipboardTextSerializer(slice: Slice): string {
	return serializeFragment(slice.content, '\n\n')
}
