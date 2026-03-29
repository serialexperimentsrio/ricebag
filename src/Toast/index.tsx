import { flushSync } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ToastBoxProps } from './ToastBox'
import { ToastBox } from './ToastBox'
import style from './style.module.css'

type XLocation = 'left' | 'right'
type YLocation = 'top' | 'bottom'
type ForceUpdateFn = (value: Record<string, never>) => void

let toasts: ToastBoxProps[] = []
// `removedToasts` keeps height info for toasts mid-exit so the container
// doesn't collapse before the fade-out animation finishes.
let removedToasts: Record<string, number> = {}
let fadedToasts: Record<string, boolean> = {}
let xLocation: XLocation = 'right'
let yLocation: YLocation = 'bottom'
let portalUpdateFn: ForceUpdateFn | null = null
let portalInitialized = false
let toastRoot: HTMLElement | null = null

const generateId = () => Math.random().toString(36).substring(2, 9)

const updatePortal = () => portalUpdateFn?.({})

const ToastPortalContent = ({
	toasts,
	removedToasts,
	xLocation,
	yLocation
}: {
	toasts: ToastBoxProps[]
	removedToasts: Record<string, number>
	xLocation: XLocation
	yLocation: YLocation
}) => {
	type ExtendedToastBoxProps = ToastBoxProps & {
		isPlaceholder?: boolean
	}

	// Merge live toasts with invisible placeholders for ones still animating out,
	// so the stack doesn't jump when a toast is removed.
	const allToasts: ExtendedToastBoxProps[] = [...toasts]

	Object.entries(removedToasts).forEach(([id, height]) => {
		if (!allToasts.some((t) => t.id === id)) {
			allToasts.push({
				id,
				height,
				text: '',
				closeAt: new Date(),
				closing: true,
				isPlaceholder: true
			})
		}
	})

	// Total height drives the container's top offset so toasts stack from the edge inward.
	const totalHeight = allToasts.reduce(
		(acc, toast) => acc + toast.height + 10,
		8
	)

	const toastList =
		yLocation === 'top' ? [...allToasts].reverse() : [...allToasts]

	const providerStyle = {
		...(yLocation === 'bottom'
			? { top: `calc(100% - ${totalHeight}px)` }
			: { bottom: `calc(100% - ${totalHeight}px)` }),
		[xLocation]: 0,
		transform: 'translateX(0)'
	}

	return (
		<div className={style.toastProvider} style={providerStyle} aria-live="polite" aria-atomic="false">
			{toastList.map((toast) => {
				// Render a hidden placeholder instead of nothing so the layout
				// holds its space while the toast fades out.
				if (
					(toast as ExtendedToastBoxProps).isPlaceholder ||
					fadedToasts[toast.id]
				) {
					return (
						<div
							key={toast.id}
							style={{
								height: `${toast.height}px`,
								margin: '10px',
								width: '300px',
								visibility: 'hidden',
								display: 'block',
								position: 'relative'
							}}
						/>
					)
				}

				return <ToastBox key={toast.id} {...toast} />
			})}
		</div>
	)
}

export const setToastLocation = (x: XLocation, y: YLocation) => {
	xLocation = x
	yLocation = y
}

const initToastPortal = () => {
	if (typeof document === 'undefined' || portalInitialized) return

	toastRoot = document.createElement('div')
	toastRoot.id = 'toast-portal'
	document.body.appendChild(toastRoot)

	const ToastUpdater = () => {
		const [, forceUpdate] = useState({})
		const mountedRef = useRef(false)

		useEffect(() => {
			portalUpdateFn = forceUpdate
			return () => {
				portalUpdateFn = null
			}
		}, [])

		useEffect(() => {
			mountedRef.current = true
			return () => {
				mountedRef.current = false
			}
		}, [])

		const allToastsFadedOut = useCallback(() => {
			return (
				toasts.length === 0 &&
				Object.keys(removedToasts).length === 0 &&
				Object.keys(fadedToasts).length > 0
			)
		}, [])

		// Once every toast has faded out, clear the faded set on the next
		// double-rAF so we don't wipe state before animations are truly done.
		useEffect(() => {
			if (allToastsFadedOut()) {
				const frameId = requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						fadedToasts = {}
						forceUpdate({})
					})
				})
				return () => cancelAnimationFrame(frameId)
			}
		}, [allToastsFadedOut])

		return (
			<ToastPortalContent
				toasts={toasts}
				removedToasts={removedToasts}
				xLocation={xLocation}
				yLocation={yLocation}
			/>
		)
	}

	if (toastRoot) createRoot(toastRoot).render(<ToastUpdater />)

	portalInitialized = true
}

const cleanupToasts = (immediate = false) => {
	toasts = []
	updatePortal()

	if (immediate) {
		removedToasts = {}
		fadedToasts = {}
		updatePortal()
	} else {
		// Defer cleanup by two frames so exit animations can finish painting.
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				removedToasts = {}
				fadedToasts = {}
				updatePortal()
			})
		})
	}
}

const handleRemoveToast = (id: string) => {
	const toastToRemove = toasts.find((t) => t.id === id)
	if (!toastToRemove) return

	fadedToasts = { ...fadedToasts, [id]: true }
	removedToasts = { ...removedToasts, [id]: toastToRemove.height }
	updatePortal()

	const allToastsFaded = toasts.every(
		(toast) => fadedToasts[toast.id] || toast.id === id
	)

	if (allToastsFaded) {
		cleanupToasts()
	}
}

export const toast = (content: string) => {
	// Defer to the next frame so the DOM is ready to measure height.
	requestAnimationFrame(() => {
		// Render off-screen into a hidden container to measure the real height
		// before adding to the stack, so the container offset is correct from
		// the moment the toast appears. flushSync makes the render synchronous
		// so we can measure immediately after.
		const tempId = generateId()
		const t = document.createElement('div')
		t.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;'
		document.body.appendChild(t)

		const root = createRoot(t)
		flushSync(() => {
			root.render(
				<ToastBox
					text={content}
					closing={false}
					height={200}
					id={tempId}
					closeAt={new Date(Date.now() + 5000)}
				/>
			)
		})

		const height = t.getBoundingClientRect().height
		root.unmount()
		t.remove()

		const id = generateId()
		toasts = [
			...toasts,
			{
				id,
				closeAt: new Date(Date.now() + 5000),
				closing: false,
				height,
				text: content,
				onRemove: handleRemoveToast
			}
		]

		updatePortal()
	})
}

initToastPortal()
