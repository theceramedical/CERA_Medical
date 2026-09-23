import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox, Radio, RadioGroup } from './choice.tsx';
import { Field } from './field.tsx';
import { Input, Select, Textarea } from './input.tsx';

/**
 * The accessibility contract from design-language.md section 5.10, which PRD ENQ-402 is tested
 * against.
 *
 * Every assertion here covers something that is invisible on screen. A label that is positioned
 * above an input *looks* attached whether or not `for` and `id` agree; an error message renders in
 * red either way. The only way to know the association exists is to assert it, which is why these
 * tests use accessible-name and description queries rather than checking that the elements are
 * present.
 */

describe('Field', () => {
  it('gives the control its accessible name from the visible label', () => {
    // `getByLabelText` resolves through the accessibility tree, so this passes only if `for`/`id`
    // actually agree - not merely because the label is rendered next to the input.
    render(
      <Field label="Full name">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Full name')).toBeInstanceOf(HTMLInputElement);
  });

  it('associates the hint with the control', () => {
    render(
      <Field label="Email" hint="We use this to send your reference number.">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'We use this to send your reference number.',
    );
  });

  it('associates the error with the control and announces it', () => {
    render(
      <Field label="Email" error="Enter an email address in the format name@example.com">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter an email address in the format name@example.com',
    );
    // `role="alert"` so it is read when it appears. An error the user has to go looking for is an
    // error they do not know about.
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('announces the error before the hint when both are present', () => {
    /**
     * Order in `aria-describedby` is announcement order. In an error state the error is the useful
     * part and the hint is context the user has already read, so the error comes first.
     */
    render(
      <Field label="Email" hint="Helper text" error="Error text">
        <Input />
      </Field>,
    );

    const describedBy = screen.getByLabelText('Email').getAttribute('aria-describedby') ?? '';
    const ids = describedBy.split(' ');

    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(/-error$/);
    expect(ids[1]).toMatch(/-hint$/);
  });

  it('sets aria-invalid only when there is an error', () => {
    const { rerender } = render(
      <Field label="Email">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');

    rerender(
      <Field label="Email" error="Required">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('leaves aria-describedby off entirely when there is nothing to describe', () => {
    // An `aria-describedby` pointing at ids that do not exist is handled inconsistently across
    // engines, and in the worst case suppresses the description that does exist.
    render(
      <Field label="Full name">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Full name')).not.toHaveAttribute('aria-describedby');
  });

  it('marks a required field in words rather than with an asterisk alone', () => {
    /**
     * design-language.md section 5.10. An asterisk is a learned convention, is announced as "star"
     * or skipped, and depends on a legend that has usually scrolled off the top of the form.
     */
    render(
      <Field label="Full name" required>
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('accepts an explicit id so an error summary can link to the control', () => {
    // On submit failure the form moves focus to a summary whose links target each field. That
    // needs a known id rather than a generated one.
    render(
      <Field label="Email" id="enquiry-email">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'enquiry-email');
  });

  it('generates distinct ids for sibling fields', () => {
    // Two fields sharing an id would make the second label point at the first input, so typing in
    // one would be announced as the other.
    render(
      <>
        <Field label="First name">
          <Input />
        </Field>
        <Field label="Last name">
          <Input />
        </Field>
      </>,
    );

    const first = screen.getByLabelText('First name').getAttribute('id');
    const second = screen.getByLabelText('Last name').getAttribute('id');

    expect(first).not.toBe(second);
  });

  it.each([
    ['Input', <Input key="i" />],
    ['Textarea', <Textarea key="t" />],
    [
      'Select',
      <Select key="s">
        <option value="a">A</option>
      </Select>,
    ],
  ])('wires %s the same way', (_name, control) => {
    render(<Field label="Shared contract">{control}</Field>);

    expect(screen.getByLabelText('Shared contract')).toBeInTheDocument();
  });

  it('refuses to render a control outside Field', () => {
    /**
     * Throwing rather than degrading. A control with no label renders perfectly normally - the
     * failure is invisible until someone uses a screen reader - so the only cheap place to catch it
     * is immediately, in development.
     */
    // The error is expected, so React's logging of it is noise here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Input />)).toThrow(/must be rendered inside <Field>/);

    consoleError.mockRestore();
  });
});

describe('Textarea', () => {
  it('resizes vertically only', () => {
    // Horizontal resize lets the user drag the control wider than its container, breaking the
    // layout with no way to undo it short of reloading.
    render(
      <Field label="Message">
        <Textarea />
      </Field>,
    );

    expect(screen.getByLabelText('Message')).toHaveClass('resize-y');
  });
});

describe('Checkbox', () => {
  it('is labelled by the text beside it', () => {
    render(<Checkbox label="I agree to the privacy policy" />);

    expect(
      screen.getByRole('checkbox', { name: 'I agree to the privacy policy' }),
    ).toBeInTheDocument();
  });

  it('toggles when the label text is clicked, not just the box', () => {
    // The row is the label, which is what makes the whole 44px strip a target.
    render(<Checkbox label="I agree to the privacy policy" />);

    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).not.toBeChecked();

    return userEvent.click(screen.getByText('I agree to the privacy policy')).then(() => {
      expect(checkbox).toBeChecked();
    });
  });

  it('associates its error and announces it', () => {
    render(<Checkbox label="I agree" error="You must agree before continuing" />);

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(
      'You must agree before continuing',
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('marks consent as required in words', () => {
    // PRD ENQ-401: consent that is not clearly described is not consent.
    render(<Checkbox label="I agree to the privacy policy" required />);

    expect(screen.getByRole('checkbox')).toBeRequired();
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });
});

describe('RadioGroup', () => {
  it('names the group with a legend, so the question is announced with each option', () => {
    /**
     * The reason `<fieldset>`/`<legend>` is not interchangeable with a heading above some radios:
     * only this markup makes a screen reader say "Preferred contact method, Email, radio button 1
     * of 2". The two look identical on screen.
     */
    render(
      <RadioGroup legend="Preferred contact method" name="contact">
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>,
    );

    expect(screen.getByRole('group', { name: /preferred contact method/i })).toBeInTheDocument();
  });

  /**
   * `aria-required` on a `<fieldset>` is invalid, and the requirement travels to the radios instead.
   *
   * A fieldset maps to the `group` role, and `aria-required` is only defined for widget roles - axe
   * reports it as `aria-allowed-attr`, and an attribute a browser may ignore is not a way to
   * communicate anything. Found by the browser accessibility run in WP-03.8; the jsdom axe sweep could
   * not see it, because the rule needs the computed role.
   *
   * HTML defines `required` on a radio as a constraint on the whole group, so setting it on every
   * option says the same thing in a spelling that is honoured.
   */
  it('puts the requirement on the radios, not on the fieldset', () => {
    render(
      <RadioGroup legend="Preferred contact method" name="contact" required>
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>,
    );

    expect(screen.getByRole('group')).not.toHaveAttribute('aria-required');

    for (const option of screen.getAllByRole('radio')) {
      expect(option).toBeRequired();
    }
  });

  it('leaves the radios optional when the group is', () => {
    render(
      <RadioGroup legend="Preferred contact method" name="contact">
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>,
    );

    for (const option of screen.getAllByRole('radio')) {
      expect(option).not.toBeRequired();
    }
  });

  it('states the requirement visibly in the legend as well', () => {
    // Belt and braces, and not redundant: `required` on the control drives validation, and the "(required)"
    // in the legend is what tells a sighted user before they submit.
    render(
      <RadioGroup legend="Preferred contact method" name="contact" required>
        <Radio value="email" label="Email" />
      </RadioGroup>,
    );

    expect(screen.getByRole('group', { name: /\(required\)/i })).toBeInTheDocument();
  });

  it('makes the options mutually exclusive by sharing a name', () => {
    render(
      <RadioGroup legend="Preferred contact method" name="contact">
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>,
    );

    for (const option of screen.getAllByRole('radio')) {
      expect(option).toHaveAttribute('name', 'contact');
    }
  });

  it('reports the selected option', async () => {
    const onChange = vi.fn();

    render(
      <RadioGroup
        legend="Preferred contact method"
        name="contact"
        value="email"
        onChange={onChange}
      >
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>,
    );

    expect(screen.getByRole('radio', { name: 'Email' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Phone' }));

    expect(onChange).toHaveBeenCalledWith('phone');
  });

  it('refuses to render an option outside a group', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Radio value="a" label="A" />)).toThrow(
      /must be rendered inside <RadioGroup>/,
    );

    consoleError.mockRestore();
  });
});
