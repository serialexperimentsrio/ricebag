import type { ForwardedRef, HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import style from './style.module.css'

type ImageComponentProps = {
	src: string
	className?: string
	alt: string
	fill?: boolean
	style?: React.CSSProperties
}

type BoxProps = {
	image?: string
	icon?: string
	shadowless?: boolean
	imageComponent?: React.ComponentType<ImageComponentProps>
} & HTMLAttributes<HTMLDivElement>

const defaultImageStyle: React.CSSProperties = {
	position: 'absolute',
	top: 0,
	left: 0,
	width: '100%',
	height: '100%',
	objectFit: 'cover',
}

export const Box = forwardRef(
	(
		{ image, icon, shadowless, className, children, imageComponent, ...rest }: BoxProps,
		ref: ForwardedRef<HTMLDivElement>
	) => {
		const Img = imageComponent ?? 'img'

		return (
			<div
				{...rest}
				ref={ref}
				className={`${style.box} ${shadowless ? '' : 'shadow'} ${className || ''}`}
			>
				{image && (
					<Img
						src={image}
						className={`boxbg ${style.bg}`}
						alt="Background decoration"
						fill={imageComponent != null ? true : undefined}
						style={imageComponent == null ? defaultImageStyle : undefined}
					/>
				)}
				{icon && (
					<Img
						src={icon}
						className={`boxiconbg ${style.iconbg}`}
						alt="Icon background decoration"
						fill={imageComponent != null ? true : undefined}
						style={imageComponent == null ? defaultImageStyle : undefined}
					/>
				)}
				{children}
			</div>
		)
	}
)

Box.displayName = 'Box'
