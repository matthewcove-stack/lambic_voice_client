import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClarificationModal } from './ClarificationModal';

describe('ClarificationModal', () => {
  it('submits free-text answer payload', async () => {
    const onSubmit = vi.fn();
    render(
      <ClarificationModal
        open
        clarification={{
          clarification_id: 'clar-1',
          intent_id: 'intent-1',
          question: 'Project?',
          expected_answer_type: 'free_text',
          candidates: [],
          status: 'open',
        }}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.type(screen.getByRole('textbox', { name: 'Project?' }), 'BrainOS');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Clarifications' }));

    expect(onSubmit).toHaveBeenCalledWith({ answer_text: 'BrainOS' });
  });
});
