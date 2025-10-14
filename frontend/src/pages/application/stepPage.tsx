import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { initPublicId } from '../../store/slices/userSlice'
import {
	setStep,
	selectStep,
	selectIsFinished,
} from '../../store/slices/stepsSlice'
import type { Step } from '../../shared/lib/types'
import { DynamicStep } from '../../features/dynamicStep/dynamicStep'
import { StepFinish } from '../../features/StepFinish'

export const StepPage = () => {
	const dispatch = useAppDispatch()
	const step = useAppSelector(selectStep)
	const isFinished = useAppSelector(selectIsFinished)

	useEffect(() => {
		dispatch(initPublicId())
			.unwrap()
			.then((data: { publicId: string; currentStep: Step | null }) => {
				console.log('[initPublicId] session:', data)
				if (data?.currentStep) dispatch(setStep(data.currentStep))
			})
			.catch((e) => console.error('[initPublicId] error:', e))
	}, [dispatch])

	useEffect(() => {
		if (step) console.log('[StepPage] step in store:', step)
	}, [step])

	if (isFinished) return <StepFinish />
	return <DynamicStep />
}
