import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReferenceCode } from './reference-code';

const REQUEST_ID = '3f9a12c4-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

describe('[TC-COMP-01][UIR-CONF-11] ReferenceCode', () => {
  it('renders the short code from the request ID', () => {
    const { container } = render(<ReferenceCode requestId={REQUEST_ID} />);
    expect(container).toHaveTextContent('Referencia: 3F9A-12C4');
    expect(screen.getByText('3F9A-12C4').tagName).toBe('CODE');
  });
});
