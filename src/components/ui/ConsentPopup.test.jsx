import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import ConsentPopup from './ConsentPopup'

describe('ConsentPopup Component', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        localStorage.clear()
    })

    it('renders the popup when no consent is in localStorage', () => {
        render(<ConsentPopup />)
        expect(screen.getByText(/Data Privacy & Security Consent/i)).toBeInTheDocument()
    })

    it('hides the popup and saves to localStorage when accepted', () => {
        render(<ConsentPopup />)
        const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i })

        fireEvent.click(acceptButton)

        expect(localStorage.getItem('khushi_hygieia_consent')).toBe('true')
        expect(screen.queryByText(/Data Privacy & Security Consent/i)).not.toBeInTheDocument()
    })

    it('does not render if consent is already given', () => {
        localStorage.setItem('khushi_hygieia_consent', 'true')
        render(<ConsentPopup />)
        expect(screen.queryByText(/Data Privacy & Security Consent/i)).not.toBeInTheDocument()
    })
})
