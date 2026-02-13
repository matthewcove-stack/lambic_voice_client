import type { Clarification, NormaliserResponse } from './schemas';

type ResolvedClarification = Exclude<Clarification, undefined>;

export type ResponseViewModel =
  | { type: 'accepted'; message: string; response: NormaliserResponse }
  | { type: 'ready'; message: string; response: NormaliserResponse }
  | { type: 'executed'; message: string; response: NormaliserResponse }
  | { type: 'needs_clarification'; clarification: ResolvedClarification; message: string; response: NormaliserResponse }
  | { type: 'rejected'; message: string; response: NormaliserResponse }
  | { type: 'failed'; message: string; response: NormaliserResponse }
  | { type: 'error'; message: string; response?: NormaliserResponse };

export function toResponseViewModel(response: NormaliserResponse): ResponseViewModel {
  const message = response.message ?? response.error?.message ?? '';
  switch (response.status) {
    case 'accepted':
      return { type: 'accepted', response, message: message || 'Intent accepted by normaliser.' };
    case 'ready':
      return { type: 'ready', response, message: message || 'Intent is ready for execution.' };
    case 'executed':
      return { type: 'executed', response, message: message || 'Intent executed.' };
    case 'needs_clarification':
      if (!response.clarification) {
        return {
          type: 'error',
          response,
          message: 'Clarification status returned without clarification payload.',
        };
      }
      return {
        type: 'needs_clarification',
        clarification: response.clarification,
        response,
        message: message || 'More details are required.',
      };
    case 'failed':
      return { type: 'failed', response, message: message || 'Intent execution failed.' };
    case 'rejected':
      return { type: 'rejected', response, message: message || 'Intent was rejected.' };
    default:
      return { type: 'error', response, message: message || 'Normaliser returned an error.' };
  }
}
