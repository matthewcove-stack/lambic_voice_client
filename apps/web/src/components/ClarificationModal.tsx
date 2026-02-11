import type { ClarificationQuestion } from '../lib/schemas';

type ClarificationModalProps = {
  open: boolean;
  questions: ClarificationQuestion[];
  onCancel: () => void;
  onSubmit: (answers: Record<string, unknown>) => void;
};

export function ClarificationModal({ open, questions, onCancel, onSubmit }: ClarificationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Clarification required">
      <div className="modal">
        <h2>Clarification Required</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const answers: Record<string, unknown> = {};
            for (const question of questions) {
              const value = formData.get(question.key);
              if (question.type === 'boolean') {
                answers[question.key] = value === 'true';
                continue;
              }
              if (question.type === 'number') {
                answers[question.key] = value ? Number(value) : null;
                continue;
              }
              answers[question.key] = value;
            }
            onSubmit(answers);
          }}
        >
          {questions.map((question) => (
            <label key={question.key} className="modal-field">
              <span>{question.prompt}</span>
              {question.type === 'choice' ? (
                <select name={question.key} required>
                  <option value="">Select</option>
                  {(question.choices ?? []).map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              ) : question.type === 'boolean' ? (
                <select name={question.key} required>
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input
                  name={question.key}
                  type={question.type === 'number' ? 'number' : 'text'}
                  required
                />
              )}
            </label>
          ))}
          <div className="modal-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit">Submit Clarifications</button>
          </div>
        </form>
      </div>
    </div>
  );
}
