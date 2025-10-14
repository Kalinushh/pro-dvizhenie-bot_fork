import type { FC } from 'react'
import { Stack, Title, Text, Group, Textarea } from '@mantine/core'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import {
	selectStep,
	selectAnswers,
	selectQIndex,
	selectFieldErrors,
	setAnswer,
	advance,
} from '../../store/slices/stepsSlice'
import { ButtonUI } from '../../shared/ui/button/buttonUI'
import { RadioButtonUI } from '../../shared/ui/radioButton/radioButtonUI'
import { TextInputUI } from '../../shared/ui/textInput/textInputUI'
import { FileButtonUI } from '../../shared/ui/fileInput/fileInputUI'
import type { Question } from '../../shared/lib/types'
import {
	isYesNo,
	isSelect,
	isText,
	isDate,
	isPhone,
	isEmailQ,
	isTextarea,
	getOptions,
	getQuestionText as getQText,
	NEED_CONSULTING_OPTIONS,
} from '../../features/dynamicStep/helpers'

const isFileMultiQ = (q: Question) => String(q.type) === 'file_multi'

export const DynamicStep: FC = () => {
	const dispatch = useAppDispatch()
	const step = useAppSelector(selectStep)
	const answers = useAppSelector(selectAnswers)
	const qIndex = useAppSelector(selectQIndex)
	const fieldErrors = useAppSelector(selectFieldErrors)

	const questions: Question[] = step?.questions ?? []
	const currentQ: Question | undefined = questions[qIndex]

	if (!step || !currentQ) return null

	const value = answers[currentQ.code]
	const setVal = (v: unknown) =>
		dispatch(setAnswer({ code: currentQ.code, value: v }))
	const setCustomVal = (code: string, value: unknown) =>
		dispatch(setAnswer({ code, value }))
	const next = () => {
		void dispatch(advance())
	}
	const answerAndNext = (v: unknown) => {
		setVal(v)
		void dispatch(advance({ answeredCode: currentQ.code }))
	}

	const fieldError = fieldErrors[currentQ.code]
	const isCertYes =
		currentQ.code === 'q_tsr_certificate_has' &&
		(value === true || value === 'true')

	return (
		<Stack gap='md' w='min(92vw, 840px)' mx='auto' my='xl'>
			<Title order={2}>{step.title}</Title>
			<Text size='md'>— {getQText(currentQ)}</Text>

			{currentQ.code === 'q_who_fills' && (
				<Stack gap='sm'>
					{getOptions(currentQ).map((opt) => (
						<RadioButtonUI
							key={String(opt.value)}
							label={opt.label}
							value={opt.value}
							checked={value === opt.value}
							onChange={() => setVal(opt.value)}
						/>
					))}
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{isYesNo(currentQ) &&
				currentQ.code !== 'q_who_fills' &&
				currentQ.code !== 'q_other_funds_active' && (
					<Group gap='sm'>
						{currentQ.code === 'q_tsr_certificate_has' ? (
							<>
								{/* На "Да" не уходим со шага: показываем ниже блок с 3 полями */}
								<ButtonUI label='Да' onClick={() => setVal(true)} />
								<ButtonUI
									label='Нет'
									color='gray'
									onClick={() => {
										setVal(false)
										next()
									}}
								/>
							</>
						) : (
							<>
								<ButtonUI label='Да' onClick={() => answerAndNext(true)} />
								<ButtonUI
									label='Нет'
									color='gray'
									onClick={() => answerAndNext(false)}
								/>
							</>
						)}
					</Group>
				)}

			{isCertYes && (
				<Stack gap='sm'>
					<TextInputUI
						label='Номер сертификата ТСР'
						value={String(
							(answers as Record<string, unknown>).q_tsr_cert_number ?? ''
						)}
						onChange={(e) =>
							setCustomVal(
								'q_tsr_cert_number',
								(e.currentTarget as HTMLInputElement).value
							)
						}
					/>
					{fieldErrors.q_tsr_cert_number && (
						<Text c='red' size='sm'>
							{fieldErrors.q_tsr_cert_number}
						</Text>
					)}

					<TextInputUI
						label='Сумма сертификата'
						value={String(
							(answers as Record<string, unknown>).q_tsr_cert_amount ?? ''
						)}
						onChange={(e) =>
							setCustomVal(
								'q_tsr_cert_amount',
								(e.currentTarget as HTMLInputElement).value
							)
						}
					/>
					{fieldErrors.q_tsr_cert_amount && (
						<Text c='red' size='sm'>
							{fieldErrors.q_tsr_cert_amount}
						</Text>
					)}

					<TextInputUI
						label='Сертификат действителен до (ГГГГ-ММ-ДД)'
						value={String(
							(answers as Record<string, unknown>).q_tsr_cert_valid_until ?? ''
						)}
						onChange={(e) =>
							setCustomVal(
								'q_tsr_cert_valid_until',
								(e.currentTarget as HTMLInputElement).value
							)
						}
					/>
					{fieldErrors.q_tsr_cert_valid_until && (
						<Text c='red' size='sm'>
							{fieldErrors.q_tsr_cert_valid_until}
						</Text>
					)}

					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{currentQ.code === 'q_other_funds_active' && (
				<Stack gap='sm'>
					<Group gap='sm'>
						<ButtonUI label='Да' onClick={() => setVal(true)} />
						<ButtonUI
							label='Нет'
							color='gray'
							onClick={() => {
								setVal(false)
								next()
							}}
						/>
					</Group>

					{answers['q_other_funds_active'] === true && (
						<>
							<TextInputUI
								label='Расскажите, если сбор уже ведётся'
								value={String(
									(answers as Record<string, unknown>)[
										'q_other_funds_details'
									] ?? ''
								)}
								onChange={(e) =>
									setCustomVal(
										'q_other_funds_details',
										(e.currentTarget as HTMLInputElement).value
									)
								}
							/>
							{fieldErrors['q_other_funds_details'] && (
								<Text c='red' size='sm'>
									{fieldErrors['q_other_funds_details']}
								</Text>
							)}
							<ButtonUI label='Продолжить' onClick={next} />
						</>
					)}
				</Stack>
			)}

			{isSelect(currentQ) && currentQ.code !== 'q_who_fills' && (
				<Stack gap='xs'>
					<Group gap='sm'>
						{getOptions(currentQ).map((opt) => (
							<ButtonUI
								key={String(opt.value)}
								label={opt.label}
								onClick={() => answerAndNext(opt.value)}
							/>
						))}
					</Group>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
				</Stack>
			)}

			{isText(currentQ) && (
				<Stack gap='sm'>
					<TextInputUI
						label={getQText(currentQ)}
						value={String(value ?? '')}
						onChange={(e) =>
							setVal((e.currentTarget as HTMLInputElement).value)
						}
					/>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{isPhone(currentQ) && (
				<Stack gap='sm'>
					<TextInputUI
						label={getQText(currentQ)}
						placeholder='+7XXXXXXXXXX'
						value={String(value ?? '')}
						onChange={(e) =>
							setVal((e.currentTarget as HTMLInputElement).value)
						}
						inputMode='tel'
					/>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{isEmailQ(currentQ) && (
				<Stack gap='sm'>
					<TextInputUI
						label={getQText(currentQ)}
						placeholder='Введите email'
						type='email'
						value={String(value ?? '')}
						onChange={(e) =>
							setVal((e.currentTarget as HTMLInputElement).value)
						}
					/>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{isDate(currentQ) && (
				<Stack gap='sm'>
					<TextInputUI
						label={getQText(currentQ)}
						placeholder='ГГГГ-ММ-ДД'
						value={String(value ?? '')}
						onChange={(e) =>
							setVal((e.currentTarget as HTMLInputElement).value)
						}
						inputMode='numeric'
					/>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{currentQ.code === 'q_need_consulting' && (
				<Stack gap='xs'>
					<Group gap='sm'>
						{NEED_CONSULTING_OPTIONS.map((opt) => (
							<ButtonUI
								key={opt.value}
								label={opt.label}
								onClick={() => answerAndNext(opt.value)}
							/>
						))}
					</Group>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
				</Stack>
			)}

			{isTextarea(currentQ) && currentQ.code !== 'q_need_consulting' && (
				<Stack gap='sm'>
					<Textarea
						label={getQText(currentQ)}
						autosize
						minRows={3}
						value={String(value ?? '')}
						onChange={(e) =>
							setVal((e.currentTarget as HTMLTextAreaElement).value)
						}
					/>
					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}

			{isFileMultiQ(currentQ) && (
				<Stack gap='sm' key={`${step.code}-${currentQ.code}`}>
					<Text size='sm'>{getQText(currentQ)}</Text>

					<FileButtonUI
						multiple
						accept='image/*,.pdf'
						onChange={(files) => setVal(files)}
					/>

					{(() => {
						const files = answers[currentQ.code]
						if (Array.isArray(files) && files.every((f) => f instanceof File)) {
							return (
								<Stack gap={4}>
									{files.map((f, i) => (
										<Text size='sm' key={`${f.name}-${i}`}>
											• {f.name} ({Math.round(f.size / 1024)} КБ)
										</Text>
									))}
								</Stack>
							)
						}
						return null
					})()}

					{fieldError && (
						<Text c='red' size='sm'>
							{fieldError}
						</Text>
					)}
					<ButtonUI label='Продолжить' onClick={next} />
				</Stack>
			)}
		</Stack>
	)
}
