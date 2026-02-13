import { describe, expect, it } from 'vitest';
import { toResponseViewModel } from './response';

describe('toResponseViewModel', () => {
  it('maps accepted responses', () => {
    const vm = toResponseViewModel({
      status: 'accepted',
      intent_id: 'intent-1',
      correlation_id: 'corr-1',
      message: 'ok',
    });

    expect(vm.type).toBe('accepted');
  });

  it('maps clarification payload', () => {
    const vm = toResponseViewModel({
      status: 'needs_clarification',
      intent_id: 'intent-2',
      correlation_id: 'corr-2',
      clarification: {
        clarification_id: 'clar-1',
        intent_id: 'intent-2',
        question: 'Due when?',
        expected_answer_type: 'free_text',
        candidates: [],
        status: 'open',
      },
    });

    expect(vm.type).toBe('needs_clarification');
    if (vm.type === 'needs_clarification') {
      expect(vm.clarification.clarification_id).toBe('clar-1');
    }
  });
});
