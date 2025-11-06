import type { FC } from 'react'
import { FileButton, Button } from '@mantine/core'
import type { ButtonProps } from '@mantine/core'

type Props = ButtonProps & {
	onChange: (files: File[] | File | null) => void
	multiple?: boolean
	label?: string
	accept?: string
}

export const FileButtonUI: FC<Props> = ({
	onChange,
	multiple = false,
	label = 'Прикрепить файл',
	accept,
	variant = 'filled',
	color = 'indigo',
	size = 'md',
	radius = 'xl',
	style,
	...props
}) => {
	return (
		<FileButton onChange={onChange} multiple={multiple} accept={accept}>
			{(fileButtonProps) => (
				<Button
					{...fileButtonProps}
					variant={variant}
					color={color}
					size={size}
					radius={radius}
					style={{
						maxWidth: 235,
						width: '100%',
						height: 48,
						...style,
					}}
					{...props}
				>
					{label}
				</Button>
			)}
		</FileButton>
	)
}
