import type { ClarificationQuestion, NormaliserResponse } from './schemas';

export type ResponseViewModel =
  | { type: 'accepted'; message: string }
  | { type: 'needs_clarification'; questions: ClarificationQuestion[]; message: string }
  | { type: 'rejected'; message: string }
  | { type: 'error'; message: string };

export function toResponseViewModel(response: NormaliserResponse): ResponseViewModel {
  const message = response.message ?? '';
  switch (response.status) {
    case 'accepted':
      return { type: 'accepted', message: message || 'Intent accepted by normaliser.' };
    case 'needs_clarification':
      return {
        type: 'needs_clarification',
        questions: response.clarification?.questions ?? [],
        message: message || 'More details are required.',
      };
    case 'rejected':
      return { type: 'rejected', message: message || 'Intent was rejected.' };
    case 'error':
    default:
      return { type: 'error', message: message || 'Normaliser returned an error.' };
  }
}
