import type { PopoverPosition } from './position'
import { TRANSFORMS } from './position'

export const createAnimationKeyframes = (
	position: PopoverPosition,
	height: number,
	offset: number,
	isOpening: boolean
): Keyframe[] => {
	const baseTransform = TRANSFORMS[position]

	// Slide direction is opposite to where the popover sits: a popover above
	// the trigger slides upward to exit and slides down from offset to open.
	const offsets = {
		left: `translateX(${offset}px)`,
		right: `translateX(-${offset}px)`,
		above: `translateY(${offset}px)`,
		below: `translateY(-${offset}px)`
	}
	const offsetTransform = `${baseTransform} ${offsets[position]}`

	const startFrame = {
		height: isOpening ? '0px' : `${height}px`,
		opacity: isOpening ? 0 : 1,
		overflow: 'hidden' as const,
		transform: isOpening ? offsetTransform : baseTransform
	}
	const endFrame = {
		height: isOpening ? `${height}px` : '0px',
		opacity: isOpening ? 1 : 0,
		overflow: 'hidden' as const,
		transform: isOpening ? baseTransform : offsetTransform
	}
	return [startFrame, endFrame]
}

export const measurePopoverSize = (
	element: HTMLDivElement
): { width: number; height: number } | null => {
	try {
		// Cancel any running animations so they don't distort the measurement.
		element.getAnimations().forEach((anim) => anim.cancel())

		const original = element.style.cssText

		// Position off-screen and make invisible before showing so measurement
		// never flickers on screen, then read the natural bounding rect.
		element.style.cssText = [
			'opacity: 0 !important',
			'position: fixed !important',
			'top: 0 !important',
			'left: 0 !important',
			'width: auto !important',
			'height: auto !important',
			'transform: none !important',
			'contain: layout style !important',
			'visibility: hidden !important',
			'pointer-events: none !important'
		].join('; ')

		element.showPopover()
		const rect = element.getBoundingClientRect()
		element.hidePopover()

		element.style.cssText = original

		return rect.width > 0 && rect.height > 0
			? { width: rect.width, height: rect.height }
			: null
	} catch {
		return null
	}
}
