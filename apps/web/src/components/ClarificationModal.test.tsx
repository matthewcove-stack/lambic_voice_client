import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClarificationModal } from './ClarificationModal';

describe('ClarificationModal', () => {
  it('submits dynamic answers', async () => {
    const onSubmit = vi.fn();
    render(
      <ClarificationModal
        open
        questions={[
          { key: 'project', prompt: 'Project?', type: 'string' },
          { key: 'urgent', prompt: 'Urgent?', type: 'boolean' },
        ]}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.type(screen.getByRole('textbox', { name: 'Project?' }), 'BrainOS');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Urgent?' }), 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Submit Clarifications' }));

    expect(onSubmit).toHaveBeenCalledWith({ project: 'BrainOS', urgent: true });
  });
});
