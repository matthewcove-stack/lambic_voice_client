import type { Clarification, ClarificationAnswerRequest } from '../lib/schemas';

type ClarificationModalProps = {
  open: boolean;
  clarification: Clarification | null;
  onCancel: () => void;
  onSubmit: (answer: ClarificationAnswerRequest) => void;
};

export function ClarificationModal({ open, clarification, onCancel, onSubmit }: ClarificationModalProps) {
  if (!open || !clarification) {
    return null;
  }

  const isChoice = clarification.expected_answer_type === 'choice';
  const inputType =
    clarification.expected_answer_type === 'date'
      ? 'date'
      : clarification.expected_answer_type === 'datetime'
        ? 'datetime-local'
        : 'text';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Clarification required">
      <div className="modal">
        <h2>Clarification Required</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const payload: ClarificationAnswerRequest = {};
            if (isChoice) {
              const choiceId = formData.get('choice_id');
              if (typeof choiceId === 'string' && choiceId) {
                payload.choice_id = choiceId;
              }
            } else {
              const answerText = formData.get('answer_text');
              if (typeof answerText === 'string' && answerText.trim()) {
                payload.answer_text = answerText.trim();
              }
            }
            onSubmit(payload);
          }}
        >
          <label className="modal-field">
            <span>{clarification.question}</span>
            {isChoice ? (
              <select name="choice_id" required>
                <option value="">Select</option>
                {clarification.candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            ) : (
              <input name="answer_text" type={inputType} required />
            )}
          </label>
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
