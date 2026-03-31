import { Loading } from '../Loading'
import { useRef, useState } from 'react'
import { Popover } from '../Popover'
import type { PopoverPosition } from '../Popover/position'
import style from './style.module.css'

interface DropdownItem {
	key: string
	label: string
	onPick: () => unknown
}

function DropdownContent({
	items,
	close
}: {
	items: DropdownItem[]
	close: () => void
}) {
	const [loadingIndex, setLoadingIndex] = useState<undefined | number>(undefined)
	const [focusedIndex, setFocusedIndex] = useState<number>(0)
	const itemRefs = useRef<(HTMLDivElement | null)[]>([])

	const pick = async (index: number) => {
		if (loadingIndex != null) return
		setLoadingIndex(index)
		try {
			await items[index].onPick()
			close()
		} finally {
			setLoadingIndex(undefined)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			const next = Math.min(focusedIndex + 1, items.length - 1)
			setFocusedIndex(next)
			itemRefs.current[next]?.focus()
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			const prev = Math.max(focusedIndex - 1, 0)
			setFocusedIndex(prev)
			itemRefs.current[prev]?.focus()
		} else if (e.key === 'Escape') {
			close()
		}
	}

	return (
		<div className={style.dropdown} role="listbox" onKeyDown={handleKeyDown}>
			{items.map((item, index) => (
				<div
					key={item.key}
					ref={(el) => { itemRefs.current[index] = el }}
					role="option"
					aria-selected={false}
					aria-busy={loadingIndex === index}
					tabIndex={focusedIndex === index ? 0 : -1}
					style={{ pointerEvents: loadingIndex != null ? 'none' : undefined }}
					onClick={() => pick(index)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							pick(index)
						}
					}}
				>
					<span
						style={{
							opacity:
								(loadingIndex != null &&
									(loadingIndex === index ? 0.3 : 0.7)) ||
								1
						}}
					>
						{item.label}
					</span>
					{loadingIndex === index && <Loading />}
				</div>
			))}
		</div>
	)
}

export function Dropdown({
	children,
	items,
	above,
	smartPositions,
	onOpenChange
}: {
	children: React.ReactElement
	items: DropdownItem[]
	above?: boolean
	smartPositions?: PopoverPosition[]
	onOpenChange?: (open: boolean) => void
}) {
	return (
		<Popover
			above={above}
			smartPositions={smartPositions}
			onOpenChange={onOpenChange}
			content={(closePopover) => (
				<DropdownContent items={items} close={closePopover} />
			)}
		>
			{children}
		</Popover>
	)
}
