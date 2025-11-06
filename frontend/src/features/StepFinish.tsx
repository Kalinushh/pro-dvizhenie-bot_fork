import type { FC } from 'react'
import { Paper, Stack, Title, Divider, Group, Text, Badge } from '@mantine/core'
import { useAppSelector } from '../shared/hooks/redux'
import { selectFinalAnswers, selectLabels } from '../store/slices/stepsSlice'

const format = (v: unknown) => {
	if (typeof v === 'boolean') return v ? 'Да' : 'Нет'
	if (Array.isArray(v)) return v.length ? `${v.length} файл(ов)` : '—'
	if (v === null || v === undefined || v === '') return '—'
	return String(v)
}

export const StepFinish: FC = () => {
	const answers = useAppSelector(selectFinalAnswers)
	const labels = useAppSelector(selectLabels)

	const entries = Object.entries(answers || {})

	return (
		<Paper p='lg' radius='md' shadow='sm'>
			<Stack gap='sm'>
				<Group justify='space-between'>
					<Title order={3}>Анкета заполнена</Title>
					<Badge>Черновик</Badge>
				</Group>
				<Text c='dimmed' size='sm'>
					Проверьте данные ниже. При необходимости вернитесь назад и исправьте.
				</Text>
				<Divider />

				<Stack gap='xs'>
					{entries.map(([code, value]) => (
						<Group key={code} justify='space-between' wrap='nowrap'>
							<Text fw={500} w={420} style={{ flexShrink: 0 }}>
								{labels[code] ?? code}
							</Text>
							<Text>{format(value)}</Text>
						</Group>
					))}
				</Stack>
			</Stack>
		</Paper>
	)
}
