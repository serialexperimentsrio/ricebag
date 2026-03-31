import { useState } from 'react'
import { Dropdown } from '../Dropdown'
import type { PopoverPosition } from '../Popover/position'
import style from './style.module.css'

export function Select({
	options,
	style: customStyle,
	above,
	smartPositions,
	className
}: {
	options: {
		key: string
		name: string
		onPick?: () => unknown
		default?: boolean
	}[]
	style?: React.CSSProperties
	above?: boolean
	smartPositions?: PopoverPosition[]
	className?: string
}) {
	const [optionName, setOptionName] = useState(
		options.find((o) => o.default)?.name || options[0].name
	)
	const [isOpen, setIsOpen] = useState(false)

	return (
		<Dropdown
			above={above}
			smartPositions={smartPositions}
			onOpenChange={setIsOpen}
			items={options.map((option) => ({
				key: option.key,
				label: option.name,
				onPick: async () => {
					await option.onPick?.()
					setOptionName(option.name)
				}
			}))}
		>
			<div
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						e.currentTarget.click()
					}
				}}
				className={`${style.selectTrigger} ${className}`}
				style={customStyle}
			>
				<span>{optionName}</span>
				<span className={style.arrow} aria-hidden="true">^</span>
			</div>
		</Dropdown>
	)
}
