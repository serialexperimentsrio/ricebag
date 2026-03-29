import { Box } from '../Box'
import type { ReactNode } from 'react'
import style from './style.module.css'

export function Panel({
	title,
	children,
	titleExtra,
	...rest
}: React.HTMLAttributes<HTMLDivElement> & {
	title: string
	titleExtra?: ReactNode
	children: ReactNode
}) {
	return (
		<div className={style.panel}>
			<div className={style.title}>
				<span>{title}</span>
				{titleExtra}
			</div>
			<Box className={style.box} shadowless {...rest}>
				{children}
			</Box>
		</div>
	)
}
