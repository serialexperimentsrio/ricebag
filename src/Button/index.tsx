import type { ButtonHTMLAttributes, ForwardedRef } from 'react'
import { forwardRef, useEffect, useState } from 'react'
import style from './style.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	onClick?: (() => Promise<unknown>) | (() => unknown)
	forceLoading?: boolean
	danger?: boolean
	disabled?: boolean
}

export const Button = forwardRef(
	(
		{ onClick, forceLoading, danger, disabled, ...rest }: Props,
		ref: ForwardedRef<HTMLButtonElement>
	) => {
		const [loading, setLoading] = useState(forceLoading)

		useEffect(() => {
			setLoading(forceLoading)
		}, [forceLoading])

		const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
			if (onClick == null) return
			e.preventDefault()
			setLoading(true)
			try {
				await onClick()
			} finally {
				setLoading(false)
			}
		}

		const isDisabled = disabled || loading || forceLoading

		return (
			<button
				{...rest}
				ref={ref}
				onClick={handleClick}
				disabled={isDisabled}
				className={`
					${(loading || forceLoading) && style.loading}
					${danger && style.danger}
					${rest.className}
					${style.button}
				`}
			/>
		)
	}
)

Button.displayName = 'Button'
