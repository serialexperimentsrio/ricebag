import { Box } from '../../Box'
import { useEffect, useRef, useState } from 'react'
import styles from './style.module.css'

export type ToastType = 'default' | 'error' | 'success' | 'warning' | 'info'

export interface ToastBoxProps {
	id: string
	closeAt: Date
	closing: boolean
	height: number
	text: string
	type?: ToastType
	onRemove?: (id: string) => void
}

export default function ToastBox(props: ToastBoxProps) {
	const [isClosing, setIsClosing] = useState(false)
	const [isAnimationComplete, setIsAnimationComplete] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)

	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const startClosing = () => {
		setIsClosing(true)

		// remove the toast after a delay that matches the CSS transition
		if (props.onRemove) {
			const onRemove = props.onRemove
			removeTimeoutRef.current = setTimeout(() => {
				setIsAnimationComplete(true)
				onRemove(props.id)
			}, 5300) // 5s transition + 300ms buffer
		}
	}

	useEffect(() => {
		// set initial timeout to start the closing animation
		const remaining = props.closeAt.getTime() - Date.now()
		closeTimeoutRef.current = setTimeout(() => {
			startClosing()
		}, Math.max(0, remaining))

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
		// restart the timeout when mouse leaves
		closeTimeoutRef.current = setTimeout(() => {
			startClosing()
		}, 1500)
	}

	const getToastStyles = (): React.CSSProperties => {
		switch (props.type) {
			case 'error':
				return { background: 'color-mix(in srgb, var(--rb-color-danger) 40%, var(--rb-color-main))', borderColor: 'color-mix(in srgb, var(--rb-color-danger) 80%, var(--rb-color-accent))' }
			case 'warning':
				return { background: 'color-mix(in srgb, rgba(255,200,0,0.15) 60%, var(--rb-color-main))', borderColor: 'rgba(255,200,0,0.5)' }
			case 'success':
				return { background: 'color-mix(in srgb, rgba(0,200,100,0.15) 60%, var(--rb-color-main))', borderColor: 'rgba(0,200,100,0.5)' }
			case 'info':
				return { background: 'color-mix(in srgb, var(--rb-color-backdrop) 60%, var(--rb-color-main))', borderColor: 'var(--rb-color-accent)' }
			default:
				return {}
		}
	}

	return (
		<Box
			ref={boxRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={`${styles.toast} ${isClosing ? styles.closing : ''}`}
			style={{
				pointerEvents: isAnimationComplete ? 'none' : 'auto',
				...getToastStyles()
			}}
		>
			<p>{props.text}</p>
		</Box>
	)
}
