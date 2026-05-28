import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ToastBoxProps, ToastType } from './ToastBox'
import ToastBox from './ToastBox'
import style from './style.module.css'

type XLocation = 'left' | 'right'
type YLocation = 'top' | 'bottom'
type ForceUpdateFn = (value: Record<string, never>) => void

// global state for toast system
let toasts: ToastBoxProps[] = []
let removedToasts: Record<string, number> = {}
let fadedToasts: Record<string, boolean> = {}
let xLocation: XLocation = 'right'
let yLocation: YLocation = 'bottom'
let portalUpdateFn: ForceUpdateFn | null = null
let portalInitialized = false
let toastRoot: HTMLElement | null = null
let hideToasts = false

// helper to generate random id
const generateId = () => Math.random().toString(36).substring(2, 9)

// helper to force update the portal
const updatePortal = () => portalUpdateFn?.({})

// toast portal component to render toasts outside of normal DOM hierarchy
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
	// extend ToastBoxProps to include placeholder flag
	type ExtendedToastBoxProps = ToastBoxProps & {
		isPlaceholder?: boolean
	}

	// create a combined list of all toasts (visible and placeholders)
	const allToasts: ExtendedToastBoxProps[] = [...toasts]

	// add placeholder entries for removed toasts
	Object.entries(removedToasts).forEach(([id, height]) => {
		// only add if not already in the list
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

	// calculate total height of all toasts
	const totalHeight = allToasts.reduce(
		(acc, toast) => acc + toast.height + 10,
		8
	)

	// prepare the toast list in the right order
	const toastList = yLocation === 'top' ? [...allToasts].reverse() : [...allToasts]

	// fix for first toast starting from target x offset
	const providerStyle: React.CSSProperties = {
		...(yLocation === 'bottom'
			? { top: `calc(100% - ${totalHeight}px)` }
			: { bottom: `calc(100% - ${totalHeight}px)` }),
		[xLocation]: 0,
		transform: 'translateX(0)'
	}

	return (
		<div
			className={style.toastProvider}
			role="status"
			aria-live="polite"
			aria-atomic="false"
			style={{
				...providerStyle,
				display: hideToasts ? 'none' : undefined
			}}
		>
			{toastList.map((toast) => {
				// if it's a placeholder or a faded toast, render an invisible placeholder
				if (
					(toast as ExtendedToastBoxProps).isPlaceholder ||
					fadedToasts[toast.id]
				) {
					return (
						<div
							key={toast.id}
							className="toast-placeholder"
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

				// otherwise render the actual toast
				return <ToastBox key={toast.id} {...toast} />
			})}
		</div>
	)
}

// function to set toast location
export const setToastLocation = (x: XLocation, y: YLocation) => {
	xLocation = x
	yLocation = y
}

// function to set toast visibility
export const setToastVisibility = (visible: boolean) => {
	hideToasts = !visible
	updatePortal()
}

// function to initialize the toast portal
const initToastPortal = () => {
	if (typeof document === 'undefined' || portalInitialized) return

	// create a single toast root element directly in body
	toastRoot = document.createElement('div')
	toastRoot.id = 'toast-portal'
	document.body.appendChild(toastRoot)

	// create a component to manage toast updates
	const ToastUpdater = () => {
		const [, forceUpdate] = useState({})
		const mountedRef = useRef(false)

		// store the update function for external use
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

		return (
			<ToastPortalContent
				toasts={toasts}
				removedToasts={removedToasts}
				xLocation={xLocation}
				yLocation={yLocation}
			/>
		)
	}

	// render the toast updater directly into the toast root
	if (toastRoot) createRoot(toastRoot).render(<ToastUpdater />)

	portalInitialized = true
}

// function to clean up toast state
const cleanupToasts = (immediate = false) => {
	// clear toasts immediately
	toasts = []
	updatePortal()

	// if immediate cleanup requested, clear everything now
	if (immediate) {
		removedToasts = {}
		fadedToasts = {}
		updatePortal()
	} else {
		// otherwise mark for cleanup on next animation frame
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				removedToasts = {}
				fadedToasts = {}
				updatePortal()
			})
		})
	}
}

// function to handle removing a toast globally
const handleRemoveToast = (id: string) => {
	const toastToRemove = toasts.find((t) => t.id === id)
	if (!toastToRemove) return

	// mark this toast as faded and store its height
	fadedToasts = { ...fadedToasts, [id]: true }
	removedToasts = { ...removedToasts, [id]: toastToRemove.height }
	updatePortal()

	// check if all toasts are now faded
	const allToastsFaded = toasts.every(
		(toast) => fadedToasts[toast.id] || toast.id === id
	)

	// if all toasts are faded, schedule a cleanup
	if (allToastsFaded) {
		cleanupToasts()
	}
}

// exported function to add a toast
export const popToast = (content: string, type?: ToastType) => {
	// use requestAnimationFrame to ensure DOM is ready
	requestAnimationFrame(() => {
		// create a temporary element to measure the height
		// SECURITY: Use textContent instead of innerHTML to prevent potential XSS
		const tempId = generateId()
		// Render component for height measurement without innerHTML
		const tempContainer = document.createElement('div')
		tempContainer.style.position = 'absolute'
		tempContainer.style.visibility = 'hidden'
		tempContainer.style.width = '300px'
		const tempRoot = createRoot(tempContainer)
		document.body.appendChild(tempContainer)

		// Render the component to measure its height
		tempRoot.render(
			<ToastBox
				text={content}
				closing={false}
				height={200}
				id={tempId}
				closeAt={new Date(Date.now() + 1500)}
				type={type}
			/>
		)

		// Use requestAnimationFrame to ensure rendering is complete
		requestAnimationFrame(() => {
			// Get the actual ToastBox element inside the container
			const toastElement = tempContainer.firstElementChild as HTMLElement
			const boxHeight = toastElement ? toastElement.offsetHeight : 50
			tempRoot.unmount()
			tempContainer.remove()

			// create and add the new toast
			const id = generateId()
			toasts = [
				...toasts,
				{
					id,
					closeAt: new Date(Date.now() + 2500),
					closing: false,
					height: boxHeight,
					text: content,
					type,
					onRemove: handleRemoveToast
				}
			]

			updatePortal()
		})
	})
}

initToastPortal()
