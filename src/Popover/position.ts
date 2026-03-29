export type PopoverPosition = 'above' | 'below' | 'left' | 'right'

export const POPOVER_CONFIG = {
	viewportPadding: 20,
	triggerSpacing: 5,
	animationOffset: {
		small: 10,
		medium: 20
	},
	animation: {
		duration: 300,
		fill: 'forwards' as const,
		easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
	}
}

// Base transforms per position — these are the resting state after animation.
export const TRANSFORMS = {
	above: 'translateX(-50%) translateY(-100%)',
	below: 'translateX(-50%)',
	left: 'translateX(-100%) translateY(-50%)',
	right: 'translateY(-50%)'
} as const

// Walk up the DOM to check if the trigger lives inside a fixed container.
// Needed so we know whether to use fixed or absolute positioning for the popover.
export const isInsideFixedContainer = (element: Element): boolean => {
	let current = element.parentElement
	while (current && current !== document.body) {
		const style = window.getComputedStyle(current)
		if (style.position === 'fixed') return true
		current = current.parentElement
	}
	return false
}

export const createPositionStyle = (
	position: PopoverPosition,
	rect: DOMRect,
	spacing: number,
	padding: number,
	scrollTop: number,
	scrollLeft: number,
	useFixed: boolean = false,
	popoverSize?: { width: number; height: number }
) => {
	const base = {
		position: useFixed ? ('fixed' as const) : ('absolute' as const),
		zIndex: 'var(--z-popover)',
		visibility: 'visible' as const,
		opacity: 1,
		contain: 'layout' as const
	}

	const maxWidth = `calc(100vw - ${padding * 2}px)`
	const minWidth = rect.width > 0 ? `${rect.width}px` : 'auto'
	const minHeight = rect.height > 0 ? `${rect.height}px` : 'auto'

	// Fixed positioning gives us viewport coords directly; absolute needs scroll offset added.
	const x = useFixed ? rect.left : rect.left + scrollLeft
	const y = useFixed ? rect.top : rect.top + scrollTop

	const width = popoverSize?.width || 200

	const scrollOffsetX = useFixed ? 0 : scrollLeft

	const positions = {
		above: {
			...base,
			// Center on the trigger horizontally, clamped so it never bleeds off the viewport.
			left: `clamp(${padding + width / 2}px, ${x + rect.width / 2}px, calc(100vw - ${padding}px - ${width / 2}px + ${scrollOffsetX}px))`,
			top: `${y - spacing}px`,
			transform: TRANSFORMS.above,
			minWidth,
			maxWidth
		},
		below: {
			...base,
			left: `clamp(${padding + width / 2}px, ${x + rect.width / 2}px, calc(100vw - ${padding}px - ${width / 2}px + ${scrollOffsetX}px))`,
			top: `${y + rect.height + spacing}px`,
			transform: TRANSFORMS.below,
			minWidth,
			maxWidth
		},
		left: {
			...base,
			left: `max(${padding + width}px, ${x - spacing}px)`,
			top: `${y + rect.height / 2}px`,
			transform: TRANSFORMS.left,
			maxWidth,
			minHeight
		},
		right: {
			...base,
			left: `min(${x + rect.width + spacing}px, calc(100vw - ${padding}px - ${width}px + ${scrollOffsetX}px))`,
			top: `${y + rect.height / 2}px`,
			transform: TRANSFORMS.right,
			maxWidth,
			minHeight
		}
	}

	return positions[position] || positions.below
}

export const getAvailableSpace = (triggerRect: DOMRect, padding: number) => ({
	above: triggerRect.top - padding,
	below: window.innerHeight - (triggerRect.top + triggerRect.height) - padding,
	left: triggerRect.left - padding,
	right: window.innerWidth - (triggerRect.left + triggerRect.width) - padding
})

export const checkPositionFit = (
	position: PopoverPosition,
	triggerRect: DOMRect,
	size: { width: number; height: number },
	padding: number,
	scrollTop: number,
	useFixed: boolean
): boolean => {
	const space = getAvailableSpace(triggerRect, padding)
	const { triggerSpacing } = POPOVER_CONFIG

	if (position === 'above' || position === 'below') {
		const hasVerticalSpace = space[position] >= size.height + triggerSpacing

		const centerX = triggerRect.left + triggerRect.width / 2
		const hasHorizontalSpace =
			centerX - size.width / 2 >= padding &&
			centerX + size.width / 2 <= window.innerWidth - padding

		return hasVerticalSpace && hasHorizontalSpace
	} else {
		const hasHorizontalSpace = space[position] >= size.width + triggerSpacing

		const centerY = triggerRect.top + triggerRect.height / 2
		const topEdge = centerY - size.height / 2
		const bottomEdge = centerY + size.height / 2

		if (useFixed) {
			return hasHorizontalSpace && topEdge >= padding && bottomEdge <= window.innerHeight - padding
		} else {
			return hasHorizontalSpace && topEdge >= scrollTop + padding
		}
	}
}

export const determinePosition = (
	triggerRect: DOMRect,
	size: { width: number; height: number } | null,
	scrollTop: number,
	_scrollLeft: number,
	useFixed: boolean,
	above?: boolean,
	below?: boolean,
	left?: boolean,
	right?: boolean,
	smartPositions?: PopoverPosition[]
): PopoverPosition => {
	// Explicit direction props always win over smart positioning.
	if (right) return 'right'
	if (left) return 'left'
	if (below) return 'below'
	if (above) return 'above'

	if (!size) return 'below'

	const { viewportPadding: padding, triggerSpacing: spacing } = POPOVER_CONFIG

	// Score each candidate position: prefer ones that fit completely,
	// then rank by direction preference (below > above > right > left).
	const testPositions: PopoverPosition[] = smartPositions || ['below', 'above', 'right', 'left']
	const positionScores: Array<{ position: PopoverPosition; score: number; fits: boolean }> = []

	for (const position of testPositions) {
		const fits = checkPositionFit(position, triggerRect, size, padding, scrollTop, useFixed)

		let score = 0
		if (position === 'below') score += 1000
		else if (position === 'above') score += 900
		else if (position === 'right') score += 800
		else if (position === 'left') score += 700

		if (fits) score += 500

		const availableSpace = getAvailableSpace(triggerRect, padding)[position]
		const sizeNeeded =
			position === 'below' || position === 'above'
				? size.height + spacing
				: size.width + spacing
		score += Math.min(1, sizeNeeded / availableSpace) * 100

		positionScores.push({ position, score, fits })
	}

	positionScores.sort((a, b) => {
		if (a.fits && !b.fits) return -1
		if (!a.fits && b.fits) return 1
		return b.score - a.score
	})

	return positionScores[0]?.position || 'below'
}
