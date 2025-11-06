import type { FC, ReactNode, MouseEventHandler } from 'react'
import { Button } from '@mantine/core'
import type { ButtonProps } from '@mantine/core'

interface ButtonUIProps extends Omit<ButtonProps, 'children'> {
	label: ReactNode
	onClick?: MouseEventHandler<HTMLButtonElement>
}

export const ButtonUI: FC<ButtonUIProps> = ({
	label,
	variant = 'filled',
	color = 'indigo',
	size = 'md',
	radius = 'xl',
	style,
	onClick,
	...props
}) => {
	return (
		<Button
			variant={variant}
			color={color}
			size={size}
			radius={radius}
			style={{
				maxWidth: 235,
				width: '100%',
				height: 48,
				marginTop:68,
				...style,
			}}
			onClick={onClick}
			{...props}
		>
			{label}
		</Button>
	)
}
