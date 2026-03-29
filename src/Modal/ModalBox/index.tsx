import { Box } from '../../Box'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { isModalTransitioning, registerCloseAnimation } from '../'
import { ANIMATION_CONFIG } from '../animationConfig'
import style from './style.module.css'

export interface ModalBoxProps {
	className?: string
	style?: React.CSSProperties
	children: React.ReactNode
	icon?: string
	image?: string
}

export type ModalBoxComponent = React.ReactElement<ModalBoxProps>

export const ModalBox = ({
	className,
	style: propStyle,
	children,
	icon,
	image
}: ModalBoxProps) => {
	const divRef = useRef<HTMLDivElement>(null)
	const opened = useRef(false)

	// Auto-focus the first input when the modal mounts, e.g. for forms.
	useEffect(() => {
		divRef.current?.querySelector('input')?.focus({ preventScroll: true })
	}, [])

	useEffect(() => {
		if (!divRef.current) return

		const animateOuterModal = (from: Keyframe, to: Keyframe) => {
			if (!divRef.current) return
			divRef.current.parentElement?.animate([from, to], {
				duration: ANIMATION_CONFIG.modalTransition.duration,
				easing: ANIMATION_CONFIG.modalTransition.easing,
				fill: 'forwards'
			})
		}

		const getInitialFilter = () => ANIMATION_CONFIG.modalTransition.initialFilter

		const finalStyles = () => {
			const rect = divRef.current?.getBoundingClientRect()
			return { width: `${rect?.width ?? 0}px`, height: `${rect?.height ?? 0}px` }
		}

		const openModal = () => {
			// If a nested transition is in progress, cancel any animation
			// that's already running so the new one starts cleanly.
			if (isModalTransitioning() && divRef.current?.parentElement) {
				divRef.current.parentElement.getAnimations().forEach((anim) => anim.cancel())
			}
			const fin = finalStyles()
			const width = parseFloat(fin.width)
			animateOuterModal(
				{ width: `${width}px`, height: 0, boxShadow: '0 0 0 0 transparent', filter: getInitialFilter() },
				fin
			)
		}

		const closeModal = (isNested = false) => {
			if (!divRef.current?.parentElement) return
			const outerModal = divRef.current.parentElement
			outerModal.getAnimations().forEach((anim) => anim.cancel())
			// Nested transitions use a shorter duration so the swap feels snappy.
			const duration = isNested
				? ANIMATION_CONFIG.nestedTransition.duration
				: ANIMATION_CONFIG.modalTransition.duration
			const fin = finalStyles()
			const width = parseFloat(fin.width)
			const anim = outerModal.animate(
				[fin, { width: `${width}px`, height: 0, filter: getInitialFilter() }],
				{ duration, easing: ANIMATION_CONFIG.modalTransition.easing, fill: 'forwards' }
			)
			anim.onfinish = () => {
				outerModal.style.visibility = 'hidden'
			}
		}

		registerCloseAnimation((isNested?: boolean) => closeModal(isNested))

		// Double rAF: first frame waits for React's DOM commit,
		// second frame waits for the browser's layout pass so
		// getBoundingClientRect() returns real dimensions.
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				openModal()
				opened.current = true
			})
		})

		let resizeRafId: number | undefined
		const resizeObserver = new ResizeObserver(() => {
			if (!opened.current) return
			// Debounce via rAF so rapid content changes don't queue multiple animations.
			if (resizeRafId !== undefined) cancelAnimationFrame(resizeRafId)
			resizeRafId = requestAnimationFrame(() => {
				resizeRafId = undefined
				animateOuterModal({}, finalStyles())
			})
		})

		resizeObserver.observe(divRef.current)

		const currentRef = divRef.current
		return () => {
			if (currentRef) resizeObserver.unobserve(currentRef)
			if (resizeRafId !== undefined) cancelAnimationFrame(resizeRafId)
		}
	}, [])

	return (
		<Box
			image={image}
			icon={icon}
			className={`outerModal ${style.outerModal}`}
		>
			<div
				ref={divRef}
				className={`${style.innerModal}${className ? ` ${className}` : ''}`}
				style={propStyle}
			>
				{children}
			</div>
		</Box>
	)
}
