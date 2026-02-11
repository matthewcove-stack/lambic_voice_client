import { describe, expect, it } from 'vitest';
import { toResponseViewModel } from './response';

describe('toResponseViewModel', () => {
  it('maps accepted responses', () => {
    const vm = toResponseViewModel({
      status: 'accepted',
      request_id: 'req-1',
      message: 'ok',
      clarification: null,
    });

    expect(vm.type).toBe('accepted');
  });

  it('exposes clarification questions', () => {
    const vm = toResponseViewModel({
      status: 'needs_clarification',
      request_id: 'req-2',
      clarification: {
        questions: [{ key: 'due', prompt: 'Due when?', type: 'string' }],
      },
    });

    expect(vm.type).toBe('needs_clarification');
    if (vm.type === 'needs_clarification') {
      expect(vm.questions[0]?.key).toBe('due');
    }
  });
});
