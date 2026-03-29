import type { ForwardedRef, ImgHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import style from './style.module.css'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
	width?: number
	height?: number
}

export const Icon = forwardRef(
	(
		{ width, height, ...rest }: Props,
		ref: ForwardedRef<HTMLImageElement>
	) => {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				{...rest}
				draggable={false}
				ref={ref}
				alt={rest.alt || 'Icon'}
				style={{
					width: width ?? height ?? 16,
					height: height ?? width ?? 16,
					...rest.style
				}}
				className={`${rest.className} ${style.icon}`}
			/>
		)
	}
)

Icon.displayName = 'Icon'
