import { Box } from '../Box'
import React, { useEffect, useId, useRef, useState } from 'react'
import style from './style.module.css'
import {
	type PopoverPosition,
	POPOVER_CONFIG,
	createPositionStyle,
	determinePosition,
	isInsideFixedContainer
} from './position'
import { setupObservers } from './observers'
import { createAnimationKeyframes, measurePopoverSize } from './animation'

function PopoverContent({
	open,
	children,
	position,
	popoverRef,
	onAnimationComplete,
	contentRef,
	openSizeRef,
	isMeasuring
}: {
	open: boolean
	children: React.ReactNode
	position: PopoverPosition
	popoverRef: React.RefObject<HTMLDivElement | null>
	onAnimationComplete?: () => void
	contentRef?: React.RefObject<HTMLDivElement | null>
	openSizeRef: React.RefObject<{ width: number; height: number } | null>
	isMeasuring: boolean
}) {
	const internalContentRef = useRef<HTMLDivElement>(null)
	const actualContentRef = contentRef || internalContentRef
	const animationRef = useRef<Animation | null>(null)
	const previousOpenRef = useRef<boolean>(open)

	useEffect(() => {
		// Skip if `open` hasn't actually changed or we're still in the measurement phase.
		if (previousOpenRef.current === open || isMeasuring) return
		previousOpenRef.current = open

		if (!popoverRef.current || !actualContentRef.current) return

		if (animationRef.current) {
			animationRef.current.cancel()
			animationRef.current = null
		}

		let currentSize = { width: 0, height: 0 }

		if (open) {
			// Use the size measured by the parent before the popover was shown,
			// so the height animation starts from 0 and expands to the right value.
			currentSize = openSizeRef.current || { width: 0, height: 0 }

			popoverRef.current.style.width = 'auto'
			popoverRef.current.style.height = '0px'
			popoverRef.current.style.overflow = 'hidden'

			const keyframes = createAnimationKeyframes(
				position,
				currentSize.height,
				POPOVER_CONFIG.animationOffset.medium,
				true
			)

			animationRef.current = popoverRef.current.animate(keyframes, POPOVER_CONFIG.animation)

			// Cancel the fill:forwards effect once open so the popover can
			// resize naturally if its content changes after it's open.
			animationRef.current.onfinish = () => {
				if (popoverRef.current && open) {
					animationRef.current?.cancel()
					popoverRef.current.style.height = 'auto'
					popoverRef.current.style.overflow = 'visible'
				}
			}
		} else {
			currentSize = openSizeRef.current || { width: 0, height: 0 }

			const keyframes = createAnimationKeyframes(
				position,
				currentSize.height,
				POPOVER_CONFIG.animationOffset.small,
				false
			)

			animationRef.current = popoverRef.current.animate(keyframes, POPOVER_CONFIG.animation)

			animationRef.current.onfinish = () => {
				if (onAnimationComplete) onAnimationComplete()
			}
		}
		// popoverRef, actualContentRef, openSizeRef are stable refs — excluding them
		// is intentional so this only re-runs when open/position/isMeasuring changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, position, onAnimationComplete, isMeasuring])

	useEffect(() => {
		return () => {
			if (animationRef.current) animationRef.current.cancel()
		}
	}, [])

	return (
		<div ref={actualContentRef} className={style.popoverContent}>
			{children}
		</div>
	)
}

export function Popover({
	children,
	content,
	above,
	below,
	left,
	right,
	smartPositions,
	defaultOpen = false,
	noCloseOnClickOutside = false,
	style: customStyle,
	onOpenChange
}: {
	children?: React.ReactElement
	content: React.ReactNode | ((closePopover: () => void) => React.ReactNode)
	above?: boolean
	below?: boolean
	left?: boolean
	right?: boolean
	smartPositions?: PopoverPosition[]
	defaultOpen?: boolean
	noCloseOnClickOutside?: boolean
	style?: React.CSSProperties
	onOpenChange?: (open: boolean) => void
}) {
	useEffect(() => {
		const directionProps = [above, below, left, right].filter(Boolean)
		if (directionProps.length > 1) {
			console.warn(
				'Popover: Multiple direction props detected. Only one of "above", "below", "left", or "right" should be set. ' +
					'Precedence: right > left > below > above'
			)
		}
	}, [above, below, left, right])

	const [isOpen, setIsOpen] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isMeasuring, setIsMeasuring] = useState(false)
	const onOpenChangeRef = useRef(onOpenChange)
	onOpenChangeRef.current = onOpenChange

	useEffect(() => {
		onOpenChangeRef.current?.(isVisible)
	}, [isVisible])
	const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({})
	const [currentPosition, setCurrentPosition] = useState<PopoverPosition>('below')
	const childrenRef = useRef<HTMLSpanElement>(null)
	const popoverRef = useRef<HTMLDivElement>(null)
	const popoverContentRef = useRef<HTMLDivElement>(null)
	const openSizeRef = useRef<{ width: number; height: number } | null>(null)
	const baseId = useId()
	const popoverId = `popover-${baseId}`

	const measureSize = () =>
		popoverRef.current ? measurePopoverSize(popoverRef.current) : null

	const calculatePosition = (size: { width: number; height: number } | null) => {
		if (!childrenRef.current) return {}
		const rect = childrenRef.current.getBoundingClientRect()
		// If the trigger has no dimensions it's probably not rendered yet — bail.
		if (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)
			return {}

		const isFixed = isInsideFixedContainer(childrenRef.current)
		const scrollTop = isFixed ? 0 : window.pageYOffset || document.documentElement.scrollTop
		const scrollLeft = isFixed ? 0 : window.pageXOffset || document.documentElement.scrollLeft

		const position = determinePosition(
			rect, size, scrollTop, scrollLeft, isFixed,
			above, below, left, right, smartPositions
		)
		setCurrentPosition(position)

		const { viewportPadding: padding, triggerSpacing: spacing } = POPOVER_CONFIG
		return createPositionStyle(position, rect, spacing, padding, scrollTop, scrollLeft, isFixed, size || undefined)
	}

	const openPopover = async () => {
		if (!popoverRef.current || isVisible) return

		let finalSize: { width: number; height: number } | null = null
		let finalPosition: React.CSSProperties = {}

		try {
			// Two-pass measurement: first get the natural (unconstrained) size,
			// then re-measure with the estimated position applied so viewport
			// constraints are baked in before the animation starts.
			const naturalSize = measureSize()
			if (!naturalSize) return

			const estimatedPosition = calculatePosition(naturalSize)
			if (Object.keys(estimatedPosition).length === 0) return

			setIsMeasuring(true)
			setIsVisible(true)

			// Force the popover invisible before showing it so the measurement
			// pass never flickers on screen.
			Object.assign(popoverRef.current.style, {
				...(estimatedPosition as React.CSSProperties),
				width: 'auto',
				height: 'auto',
				overflow: 'visible',
				visibility: 'hidden !important',
				opacity: '0 !important',
				contain: 'layout style',
				animation: 'none !important',
				transition: 'none !important'
			})

			popoverRef.current.showPopover()

			await new Promise((resolve) => requestAnimationFrame(resolve))
			const constrainedRect = popoverRef.current.getBoundingClientRect()
			finalSize =
				constrainedRect.width > 0 && constrainedRect.height > 0
					? { width: constrainedRect.width, height: constrainedRect.height }
					: naturalSize

			finalPosition = calculatePosition(finalSize)
			if (Object.keys(finalPosition).length === 0) {
				finalPosition = estimatedPosition
			}

			// Apply the final position while still hidden so the animation
			// starts from exactly the right place.
			Object.assign(popoverRef.current.style, {
				...(finalPosition as React.CSSProperties),
				visibility: 'hidden !important',
				opacity: '0 !important',
				contain: 'layout style',
				animation: 'none !important',
				transition: 'none !important'
			})

			popoverRef.current.hidePopover()
		} catch {
			finalSize = measureSize()
			finalPosition = calculatePosition(finalSize)
		}

		openSizeRef.current = finalSize
		setIsOpen(false)
		setIsVisible(false)
		setIsMeasuring(false)

		await new Promise((resolve) => requestAnimationFrame(resolve))

		// Set the initial animation state (height: 0) before calling showPopover
		// so the entrance animation has a defined start frame.
		Object.assign(popoverRef.current.style, {
			...(finalPosition as React.CSSProperties),
			height: '0px',
			opacity: '0',
			overflow: 'hidden',
			animation: 'none !important',
			transition: 'none !important'
		})

		setIsVisible(true)
		setIsOpen(true)
		popoverRef.current.showPopover()
		setPositionStyle(finalPosition)
	}

	const closePopover = () => {
		if (!isVisible) return
		setIsOpen(false)
	}

	const handleCloseAnimationComplete = () => {
		if (popoverRef.current) popoverRef.current.hidePopover()
		setIsVisible(false)
		setPositionStyle({})
	}

	const togglePopover = () => {
		if (isVisible) {
			closePopover()
		} else {
			void openPopover()
		}
	}

	useEffect(() => {
		if (!isVisible || !childrenRef.current || !popoverRef.current) return

		const updatePosition = () => {
			if (!popoverRef.current || !childrenRef.current) return

			// Reset size constraints so we measure the current natural size.
			const resetStyles =
				'width: auto; height: auto; minWidth: auto; minHeight: auto; maxWidth: none; maxHeight: none; overflow: visible;'
			popoverRef.current.style.cssText += resetStyles
			void popoverRef.current.offsetHeight

			const rect = popoverRef.current.getBoundingClientRect()
			const size =
				rect.width > 0 && rect.height > 0
					? { width: rect.width, height: rect.height }
					: null
			if (!size) return

			const triggerRect = childrenRef.current.getBoundingClientRect()
			const isFixed = isInsideFixedContainer(childrenRef.current)
			let scrollTop = 0, scrollLeft = 0

			if (!isFixed) {
				scrollTop = window.pageYOffset || document.documentElement.scrollTop
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
			}

			const { viewportPadding: padding, triggerSpacing: spacing } = POPOVER_CONFIG

			// Smart positioning only runs on initial open — repositioning keeps
			// the same direction so the popover doesn't jump sides on scroll/resize.
			const positionStyle = createPositionStyle(
				currentPosition, triggerRect, spacing, padding,
				scrollTop, scrollLeft, isFixed, size
			)
			setPositionStyle(positionStyle)

			popoverRef.current.style.height = 'auto'
			popoverRef.current.style.overflow = 'visible'
		}

		return setupObservers(childrenRef.current, popoverContentRef.current, updatePosition)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVisible])

	useEffect(() => {
		if (!isVisible || noCloseOnClickOutside) return

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node
			const outsidePopover = popoverRef.current && !popoverRef.current.contains(target)
			const outsideTrigger = childrenRef.current && !childrenRef.current.contains(target)
			if (outsidePopover && outsideTrigger) closePopover()
		}

		// Delay attaching the listener by one tick so the click that opened
		// the popover doesn't immediately close it.
		const timer = setTimeout(
			() => document.addEventListener('mousedown', handleClickOutside),
			0
		)
		return () => {
			clearTimeout(timer)
			document.removeEventListener('mousedown', handleClickOutside)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVisible, noCloseOnClickOutside])

	useEffect(() => {
		if (defaultOpen && !isVisible && childrenRef.current) {
			const frameId = requestAnimationFrame(openPopover)
			return () => cancelAnimationFrame(frameId)
		}
		// Intentionally runs once on mount only.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const contentElement =
		typeof content === 'function' ? content(closePopover) : content
	const triggerElement = children
		? React.cloneElement(
				children as React.ReactElement<{
					onClick?: (e: React.MouseEvent) => void
					ref?: React.Ref<HTMLSpanElement>
				}>,
				{
					ref: childrenRef,
					onClick: (e: React.MouseEvent) => {
						const originalOnClick = (
							children as React.ReactElement<{
								onClick?: (e: React.MouseEvent) => void
							}>
						).props.onClick
						originalOnClick?.(e)
						togglePopover()
					}
				}
			)
		: null

	return (
		<>
			{triggerElement}
			<Box
				ref={popoverRef}
				popover="manual"
				id={popoverId}
				className={style.popover}
				style={{ ...positionStyle, ...customStyle } as React.CSSProperties}
			>
				<PopoverContent
					position={currentPosition}
					open={isOpen}
					popoverRef={popoverRef}
					contentRef={popoverContentRef}
					openSizeRef={openSizeRef}
					isMeasuring={isMeasuring}
					onAnimationComplete={!isOpen ? handleCloseAnimationComplete : undefined}
				>
					{contentElement}
				</PopoverContent>
			</Box>
		</>
	)
}
