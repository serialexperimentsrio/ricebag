import { Box } from '../Box'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastBoxProps {
	id: string
	closeAt: Date
	closing: boolean
	height: number
	text: string
	onRemove?: (id: string) => void
}

const DISPLAY_DURATION = 5000

export function ToastBox(props: ToastBoxProps) {
	const [isAnimationComplete, setIsAnimationComplete] = useState(false)
	const [initialDelayPassed, setInitialDelayPassed] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)
	const animationRef = useRef<Animation | null>(null)
	// Track when the toast was shown so hovering and re-hovering resumes
	// from the remaining time rather than resetting to the full duration.
	const shownAtRef = useRef<number>(0)

	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const fadeOut = useCallback(() => {
		if (!boxRef.current) return

		if (animationRef.current) {
			animationRef.current.cancel()
		}

		const animation = boxRef.current.animate(
			[{ opacity: 1 }, { opacity: 0 }],
			{ duration: 5000, fill: 'forwards', easing: 'linear' }
		)

		animationRef.current = animation

		animation.onfinish = () => {
			setIsAnimationComplete(true)

			// Short delay after fade completes before actually removing from the stack,
			// so the placeholder has time to take over and prevent layout jump.
			if (props.onRemove) {
				const onRemove = props.onRemove
				removeTimeoutRef.current = setTimeout(() => {
					onRemove(props.id)
				}, 300)
			}
		}
	}, [props])

	useEffect(() => {
		shownAtRef.current = Date.now()
		closeTimeoutRef.current = setTimeout(() => {
			setInitialDelayPassed(true)
			fadeOut()
		}, DISPLAY_DURATION)

		return () => {
			if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
			if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
			if (animationRef.current) animationRef.current.cancel()
		}
	}, [fadeOut])

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
		if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
		if (animationRef.current) animationRef.current.cancel()
		if (boxRef.current) boxRef.current.style.opacity = '1'
		setIsAnimationComplete(false)
	}

	const handleMouseLeave = () => {
		if (initialDelayPassed) {
			fadeOut()
		} else {
			// Resume from however much time is left, not the full duration.
			const elapsed = Date.now() - shownAtRef.current
			const remaining = Math.max(0, DISPLAY_DURATION - elapsed)
			closeTimeoutRef.current = setTimeout(() => {
				setInitialDelayPassed(true)
				fadeOut()
			}, remaining)
		}
	}

	return (
		<Box
			ref={boxRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className="bg-b"
			style={{
				display: 'block',
				whiteSpace: 'pre-wrap',
				width: '300px',
				margin: '10px',
				pointerEvents: isAnimationComplete ? 'none' : 'auto',
				wordWrap: 'break-word'
			}}
		>
			<p style={{ margin: 0 }}>{props.text}</p>
		</Box>
	)
}
