import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ANIMATION_CONFIG } from './animationConfig'
import style from './style.module.css'

// Single global modal state — only one modal is shown at a time.
// `previousModal` lets us restore the last modal after a nested one closes.
let currentModal: React.ReactNode | undefined
let previousModal: React.ReactNode | undefined
let previousOnClose: (() => void) | undefined
export let modalActive = false
let onCloseCallback: (() => void) | undefined
let closeInnerModalFn: ((isNested?: boolean) => void) | undefined

// Single timeout ID so we can cancel a pending transition if a new one starts.
let modalTimeoutId: number | undefined
// Generation counter prevents stale callbacks from running after rapid open/close.
let modalGeneration = 0

export const registerCloseAnimation = (
	closeFunction: (isNested?: boolean) => void
) => {
	closeInnerModalFn = closeFunction
}

let isTransitioningBetweenModals = false
export const isModalTransitioning = () => isTransitioningBetweenModals

const clearModalTimeout = () => {
	if (modalTimeoutId !== undefined) {
		clearTimeout(modalTimeoutId)
		modalTimeoutId = undefined
		isTransitioningBetweenModals = false
	}
}

// Each new modal gets a unique key so React treats it as a fresh mount,
// which ensures entrance animations always fire even for the same component.
const addKeyToModalContent = (content: React.ReactNode): React.ReactNode => {
	if (React.isValidElement(content)) {
		const uniqueKey = `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
		return React.cloneElement(content, { key: uniqueKey })
	}
	return content
}

export const setModal = (content: React.ReactNode, onClose?: () => void) => {
	if (currentModal != null) {
		previousModal = currentModal
		previousOnClose = onCloseCallback
	}

	clearModalTimeout()

	modalGeneration++
	const currentGeneration = modalGeneration

	const contentWithKey = addKeyToModalContent(content)

	// No active modal — open directly without any transition delay.
	if (!modalActive && !isTransitioningBetweenModals) {
		currentModal = contentWithKey
		onCloseCallback = onClose
		modalActive = true
		if (portalUpdateFn) portalUpdateFn({})
		return
	}

	// A modal is already open: close it first, then open the new one.
	// The short gap between close and open lets the exit animation finish.
	isTransitioningBetweenModals = true

	if (closeInnerModalFn) closeInnerModalFn(true)

	modalActive = false
	if (portalUpdateFn) portalUpdateFn({})

	const pendingContent = contentWithKey
	const pendingOnClose = onClose

	modalTimeoutId = window.setTimeout(() => {
		if (currentGeneration !== modalGeneration) return

		currentModal = undefined
		if (portalUpdateFn) portalUpdateFn({})

		// One frame gap so the DOM clears before the new modal mounts.
		window.setTimeout(() => {
			if (currentGeneration !== modalGeneration) return

			currentModal = pendingContent
			onCloseCallback = pendingOnClose
			modalActive = true
			isTransitioningBetweenModals = false
			if (portalUpdateFn) portalUpdateFn({})
		}, 16)
	}, ANIMATION_CONFIG.nestedTransition.duration)
}

export const hideModal = () => {
	previousModal = undefined
	previousOnClose = undefined

	if (!modalActive) return

	clearModalTimeout()

	modalActive = false

	if (closeInnerModalFn) closeInnerModalFn(false)

	if (portalUpdateFn) portalUpdateFn({})

	// Wait for the exit animation to finish before clearing the content,
	// otherwise the modal disappears before it has a chance to animate out.
	modalTimeoutId = window.setTimeout(() => {
		if (!modalActive) {
			currentModal = undefined
			isTransitioningBetweenModals = false
			if (portalUpdateFn) portalUpdateFn({})
		}
	}, ANIMATION_CONFIG.modalTransition.duration)
}

let portalUpdateFn: ((value: Record<string, never>) => void) | null = null

const ModalPortal = () => {
	const [, forceUpdate] = useState({})
	const dialogRef = useRef<HTMLDivElement>(null)
	const previousFocusRef = useRef<Element | null>(null)

	useEffect(() => {
		portalUpdateFn = forceUpdate
		return () => {
			portalUpdateFn = null
		}
	}, [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && modalActive) hideModal()

			// Focus trap: keep Tab cycling inside the dialog so keyboard users
			// can't accidentally navigate behind the modal.
			if (e.key === 'Tab' && modalActive && dialogRef.current) {
				const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
				if (focusable.length === 0) return
				const first = focusable[0]
				const last = focusable[focusable.length - 1]
				if (e.shiftKey) {
					if (document.activeElement === first) {
						e.preventDefault()
						last.focus()
					}
				} else {
					if (document.activeElement === last) {
						e.preventDefault()
						first.focus()
					}
				}
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	// Save focus before the modal opens so we can restore it on close.
	useEffect(() => {
		if (modalActive) {
			previousFocusRef.current = document.activeElement
			requestAnimationFrame(() => {
				const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
				firstFocusable?.focus()
			})
		} else {
			if (previousFocusRef.current instanceof HTMLElement) {
				previousFocusRef.current.focus()
			}
			previousFocusRef.current = null
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modalActive])

	return (
		<>
			<div
				onClick={() => { onCloseCallback?.(); hideModal() }}
				className={`${style.modalBackdrop} ${modalActive ? style.active : ''}`}
			/>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				style={{ display: 'contents' }}
			>
				{currentModal}
			</div>
		</>
	)
}

let portalInitialized = false

const initModalPortal = () => {
	if (typeof document === 'undefined' || portalInitialized) return

	const portal = document.createElement('div')
	portal.id = 'modal-portal'
	document.body.appendChild(portal)

	ReactDOM.createRoot(portal).render(<ModalPortal />)

	portalInitialized = true
}

export const openPreviousModal = () => {
	if (!previousModal) return
	setModal(previousModal, previousOnClose)
	previousModal = undefined
	previousOnClose = undefined
}

initModalPortal()
