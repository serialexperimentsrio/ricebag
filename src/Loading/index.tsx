import type { CSSProperties, ForwardedRef } from 'react'
import { forwardRef } from 'react'
import styles from './style.module.css'

type LoadingProps = {
	style?: CSSProperties
	inline?: boolean
	className?: string
}

export const Loading = forwardRef(
	(
		{ style, inline, className }: LoadingProps,
		ref: ForwardedRef<HTMLSpanElement>
	) => {
		return (
			<span
				ref={ref}
				className={`loadingAnimation ${styles.loadingAnimation} ${
					inline ? styles.inline : ''
				} ${className || ''}`}
				style={style}
				aria-busy="true"
				aria-label="Loading"
			>
				{['dot1', 'dot2', 'dot3'].map((id, i) => (
					<i key={id} style={{ animationDelay: `${i * 0.1}s` }} aria-hidden="true">
						.
					</i>
				))}
			</span>
		)
	}
)

Loading.displayName = 'Loading'
