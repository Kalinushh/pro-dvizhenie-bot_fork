import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { Step, Answers, Question } from '../../shared/lib/types'
import { fetchStepById, sendStepAnswer } from '../../shared/api/stepsApi'

interface StepsState {
	step: Step | null
	answers: Answers
	finalAnswers: Answers
	labels: Record<string, string>
	isLoading: boolean
	error: string | null
	isFinished: boolean
	qIndex: number
	fieldErrors: Record<string, string>
}

const initialState: StepsState = {
	step: null,
	answers: {},
	finalAnswers: {},
	labels: {},
	isLoading: false,
	error: null,
	isFinished: false,
	qIndex: 0,
	fieldErrors: {},
}

export const fetchStep = createAsyncThunk<Step, number>(
	'steps/fetchStep',
	async (stepId) => await fetchStepById(stepId)
)

const SYNC_ON_CODES = new Set<string>([
	'q_tsr_certificate_has',
	'q_esign_ready',
])

const toYMD = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type WithOptionalLabel = { label?: string }

const mergeLabels = (dst: Record<string, string>, qs: Question[] = []) => {
	const items = qs as Array<Question & WithOptionalLabel>
	for (const q of items) dst[q.code] = q.label ?? q.code
}

type ServerErrorItem = {
	question?: string
	question_code?: string
	field?: string
	message?: string
	detail?: string
}

type AdvanceError = {
	status?: number
	url?: string
	server?: { errors?: (ServerErrorItem | string)[] }
	message?: string
}

type SendAnswerServerResp =
	| null
	| Step
	| {
			answers?: Answers
			current_step?: Step | null
	  }

type AdvanceOk =
	| { progressed: true }
	| { progressed: false; nextStep: SendAnswerServerResp }

export const advance = createAsyncThunk<
	AdvanceOk,
	{ answeredCode?: string } | undefined,
	{ state: RootState; rejectValue: AdvanceError }
>('steps/advance', async (arg, { getState, rejectWithValue }) => {
	const state = getState()
	const step = state.steps.step
	if (!step) return { progressed: true }

	const questions = step.questions ?? []
	const lastIndex = Math.max(0, questions.length - 1)
	const qIndex = state.steps.qIndex

	const answeredCode = arg?.answeredCode
	const isTrigger = answeredCode ? SYNC_ON_CODES.has(answeredCode) : false
	const isStepEnd = qIndex >= lastIndex
	const shouldSyncNow = isTrigger || isStepEnd
	if (!shouldSyncNow) return { progressed: true }

	const publicId =
		(state as RootState & { user?: { publicId?: string | null } }).user
			?.publicId ?? null
	if (!publicId) return rejectWithValue({ message: 'publicId отсутствует' })

	const payload: Answers = {}
	for (const q of questions) {
		const t = String(q.type)
		let v: unknown = (state.steps.answers as Record<string, unknown>)[q.code]
		if (t === 'date' && v instanceof Date) v = toYMD(v)
		if ((t === 'file' || t === 'file_multi') && v === undefined) v = []
		if (v !== undefined) (payload as Record<string, unknown>)[q.code] = v
	}

	try {
		const resp = (await sendStepAnswer(
			publicId,
			step.code,
			payload
		)) as SendAnswerServerResp
		return { progressed: false, nextStep: resp ?? null }
	} catch (err) {
		return rejectWithValue(err as AdvanceError)
	}
})

const stepsSlice = createSlice({
	name: 'steps',
	initialState,
	reducers: {
		setAnswer: (
			state,
			action: PayloadAction<{ code: string; value: unknown }>
		) => {
			;(state.answers as Record<string, unknown>)[action.payload.code] =
				action.payload.value
			if (state.fieldErrors[action.payload.code])
				delete state.fieldErrors[action.payload.code]
		},
		resetSteps: () => initialState,
		setStep: (state, action: PayloadAction<Step>) => {
			state.step = action.payload
			state.answers = {}
			state.isFinished = false
			state.error = null
			state.qIndex = 0
			state.fieldErrors = {}
			if (action.payload?.questions)
				mergeLabels(state.labels, action.payload.questions)
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchStep.pending, (state) => {
				state.isLoading = true
				state.error = null
			})
			.addCase(fetchStep.fulfilled, (state, action) => {
				state.isLoading = false
				state.step = action.payload
				state.qIndex = 0
				state.fieldErrors = {}
				state.answers = {}
				state.labels = {}
				mergeLabels(state.labels, action.payload?.questions)
			})
			.addCase(fetchStep.rejected, (state, action) => {
				state.isLoading = false
				state.error = action.error.message || 'Ошибка загрузки шага'
			})
			.addCase(advance.pending, (state) => {
				state.isLoading = true
				state.error = null
			})
			.addCase(advance.fulfilled, (state, action) => {
				state.isLoading = false

				if ('progressed' in action.payload && action.payload.progressed) {
					const maxIdx = Math.max(0, (state.step?.questions?.length ?? 1) - 1)
					state.qIndex = Math.min(maxIdx, state.qIndex + 1)
					return
				}

				const next = (
					action.payload as {
						progressed: false
						nextStep: SendAnswerServerResp
					}
				).nextStep

				if (next) {
					if (
						typeof next === 'object' &&
						next &&
						'answers' in next &&
						next.answers
					) {
						state.finalAnswers = next.answers
					}

					const stepFromServer: Step | null =
						typeof next === 'object' && next && 'current_step' in next
							? (next.current_step ?? null)
							: (next as Step)

					if (stepFromServer) {
						state.step = stepFromServer
						state.answers = {}
						state.qIndex = 0
						state.isFinished = false
						state.fieldErrors = {}
						mergeLabels(state.labels, stepFromServer.questions)
						return
					}
				}

				state.isFinished = true
				state.step = null
			})
			.addCase(advance.rejected, (state, action) => {
				state.isLoading = false
				if (action.payload) {
					const p = action.payload as AdvanceError
					state.error = `HTTP ${p.status ?? ''} | ${p.url ?? ''}`

					const fe: Record<string, string> = {}
					const serverErrors = p.server?.errors
					if (Array.isArray(serverErrors)) {
						for (const e of serverErrors) {
							const item = e as ServerErrorItem | string
							const code =
								typeof item === 'string'
									? null
									: (item.question ?? item.question_code ?? item.field ?? null)
							const msg =
								typeof item === 'string'
									? item
									: (item.message ?? item.detail ?? JSON.stringify(item))
							if (code && msg) fe[code] = msg
						}
					}
					state.fieldErrors = fe
				} else {
					state.error = action.error.message || 'Ошибка перехода по шагам'
				}
			})
	},
})

export const { setAnswer, resetSteps, setStep } = stepsSlice.actions
export default stepsSlice.reducer

export const selectStep = (state: RootState) => state.steps.step
export const selectAnswers = (state: RootState) => state.steps.answers
export const selectFinalAnswers = (state: RootState) => state.steps.finalAnswers
export const selectLabels = (state: RootState) => state.steps.labels
export const selectIsFinished = (state: RootState) => state.steps.isFinished
export const selectIsLoading = (state: RootState) => state.steps.isLoading
export const selectStepError = (state: RootState) => state.steps.error
export const selectQIndex = (state: RootState) => state.steps.qIndex
export const selectFieldErrors = (state: RootState) => state.steps.fieldErrors
