import { Box } from '../../Box'
import { useEffect, useRef, useState } from 'react'
import styles from './style.module.css'

export type ToastType = 'default' | 'error' | 'success' | 'warning' | 'info'

// How long a toast stays fully visible, then how long it takes to fade out
export const DISPLAY_MS = 2500
const FADE_MS = 5000
// Hovering again after the fade has started gives the toast this long before fading again
const RESUME_MS = 1500

export interface ToastBoxProps {
	id: string
	closeAt: Date
	closing: boolean
	height: number
	text: string
	type?: ToastType
	onRemove?: (id: string) => void
}

// Background and border per type, each tinting the theme's main/accent colours
const TYPE_STYLES: Partial<Record<ToastType, React.CSSProperties>> = {
	error: {
		background: 'color-mix(in srgb, var(--rb-color-danger) 40%, var(--rb-color-main))',
		borderColor: 'color-mix(in srgb, var(--rb-color-danger) 80%, var(--rb-color-accent))'
	},
	warning: {
		background: 'color-mix(in srgb, var(--rb-color-warning) 40%, var(--rb-color-main))',
		borderColor: 'color-mix(in srgb, var(--rb-color-warning) 80%, var(--rb-color-accent))'
	},
	success: {
		background: 'color-mix(in srgb, var(--rb-color-success) 40%, var(--rb-color-main))',
		borderColor: 'color-mix(in srgb, var(--rb-color-success) 80%, var(--rb-color-accent))'
	},
	info: {
		background: 'color-mix(in srgb, var(--rb-color-accent) 40%, var(--rb-color-main))',
		borderColor: 'var(--rb-color-accent)'
	}
}

export default function ToastBox(props: ToastBoxProps) {
	const [isClosing, setIsClosing] = useState(false)
	const [isAnimationComplete, setIsAnimationComplete] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)

	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const startClosing = () => {
		setIsClosing(true)

		// Remove once the fade has finished, plus a short buffer
		if (props.onRemove) {
			const onRemove = props.onRemove
			removeTimeoutRef.current = setTimeout(() => {
				setIsAnimationComplete(true)
				onRemove(props.id)
			}, FADE_MS + 300)
		}
	}

	// Runs once: re-running on every parent render would restart the timer
	useEffect(() => {
		const remaining = props.closeAt.getTime() - Date.now()
		closeTimeoutRef.current = setTimeout(startClosing, Math.max(0, remaining))

		return () => {
			if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
			if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
		}
	}, [])

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
		if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
		setIsClosing(false)
		setIsAnimationComplete(false)
	}

	const handleMouseLeave = () => {
		closeTimeoutRef.current = setTimeout(startClosing, RESUME_MS)
	}

	return (
		<Box
			ref={boxRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={`${styles.toast} ${isClosing ? styles.closing : ''}`}
			style={{
				pointerEvents: isAnimationComplete ? 'none' : 'auto',
				transition: isClosing ? `opacity ${FADE_MS}ms linear` : undefined,
				...(props.type ? TYPE_STYLES[props.type] : undefined)
			}}
		>
			<p>{props.text}</p>
		</Box>
	)
}
