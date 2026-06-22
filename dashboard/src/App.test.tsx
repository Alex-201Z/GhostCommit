import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('Phase 0 health page', () => {
  it('shows the Phase 0 health message', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'GhostCommit is running' })).toBeInTheDocument();
  });
});
