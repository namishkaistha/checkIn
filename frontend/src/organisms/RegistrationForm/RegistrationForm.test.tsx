import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from './RegistrationForm';

describe('RegistrationForm', () => {
  it('disables submit until both name and a valid phone are present', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={async () => {}} />);

    const submit = screen.getByRole('button', { name: 'Register' });
    expect(submit).toHaveAttribute('aria-disabled', 'true');

    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    expect(submit).toHaveAttribute('aria-disabled', 'true');

    await user.type(screen.getByLabelText(/Phone number/), '4155552671');
    await waitFor(() => {
      expect(submit).not.toHaveAttribute('aria-disabled');
    });
  });

  it('submits the trimmed name and the E.164 phone', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Full name/), '  Jane Doe  ');
    await user.type(screen.getByLabelText(/Phone number/), '4155552671');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith('Jane Doe', '+14155552671');
  });

  it('renders Cancel only when onCancel is provided', () => {
    const { rerender } = render(
      <RegistrationForm onSubmit={async () => {}} />,
    );
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();

    rerender(
      <RegistrationForm onSubmit={async () => {}} onCancel={() => {}} />,
    );
    expect(
      screen.getByRole('button', { name: 'Cancel' }),
    ).toBeInTheDocument();
  });

  it('shows an ErrorBanner when onSubmit rejects', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error('Phone already registered'));
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Phone number/), '4155552671');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Phone already registered',
      );
    });
  });

  it('pre-fills the phone field when initialPhone is provided', () => {
    render(
      <RegistrationForm
        initialPhone="+14155552671"
        onSubmit={async () => {}}
      />,
    );
    // libphonenumber's AsYouType doesn't reformat E.164 input on first render,
    // but the parsed value is good enough to enable submit when paired with
    // a name. So we assert the visible value.
    expect(screen.getByLabelText(/Phone number/)).toHaveValue('+14155552671');
  });
});
