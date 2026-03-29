export const setupObservers = (
	triggerElement: HTMLElement,
	popoverContentElement: HTMLElement | null,
	updatePosition: () => void
) => {
	// Debounce position updates so rapid resize/scroll events don't thrash layout.
	let updateTimeout: number | undefined
	const debouncedUpdate = () => {
		if (updateTimeout) clearTimeout(updateTimeout)
		updateTimeout = window.setTimeout(updatePosition, 8)
	}

	const targetResizeObserver = new ResizeObserver(debouncedUpdate)
	const popoverResizeObserver = new ResizeObserver(debouncedUpdate)

	// Watch the trigger and up to 5 ancestor elements — layout changes higher
	// up the tree can shift the trigger without the trigger itself resizing.
	targetResizeObserver.observe(triggerElement)
	let currentElement = triggerElement.parentElement
	let depth = 0
	while (currentElement && currentElement !== document.body && depth < 5) {
		targetResizeObserver.observe(currentElement)
		currentElement = currentElement.parentElement
		depth++
	}

	if (popoverContentElement) {
		popoverResizeObserver.observe(popoverContentElement)
	}

	// Also track scroll on every scrollable ancestor so the popover follows
	// when the trigger scrolls within a container.
	const scrollableParents: Element[] = []
	let scrollParent = triggerElement.parentElement
	while (scrollParent && scrollParent !== document.documentElement) {
		const computedStyle = window.getComputedStyle(scrollParent)
		if (
			computedStyle.overflow === 'auto' ||
			computedStyle.overflow === 'scroll' ||
			computedStyle.overflowX === 'auto' ||
			computedStyle.overflowX === 'scroll' ||
			computedStyle.overflowY === 'auto' ||
			computedStyle.overflowY === 'scroll'
		) {
			scrollableParents.push(scrollParent)
			scrollParent.addEventListener('scroll', debouncedUpdate, { passive: true })
		}
		scrollParent = scrollParent.parentElement
	}

	document.addEventListener('scroll', debouncedUpdate, { passive: true })

	// Mutation observer catches class/style/transform changes on the trigger's
	// immediate container that would affect its position without a resize.
	const mutationObserver = new MutationObserver(() => {
		requestAnimationFrame(debouncedUpdate)
	})

	const observeTarget = triggerElement.parentElement || document.body
	mutationObserver.observe(observeTarget, {
		attributes: true,
		attributeFilter: ['style', 'class', 'transform'],
		childList: true,
		subtree: true
	})

	window.addEventListener('resize', debouncedUpdate)

	return () => {
		targetResizeObserver.disconnect()
		popoverResizeObserver.disconnect()
		mutationObserver.disconnect()
		window.removeEventListener('resize', debouncedUpdate)
		document.removeEventListener('scroll', debouncedUpdate)

		for (const parent of scrollableParents) {
			parent.removeEventListener('scroll', debouncedUpdate)
		}

		if (updateTimeout) clearTimeout(updateTimeout)
	}
}
