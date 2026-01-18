import { memo, useRef, useCallback, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
}

/**
 * Reusable OTP Input Component
 * - 6 digit input boxes with auto-focus navigation
 * - Paste support
 * - Mobile numpad keyboard
 * - Accessibility support
 */
const OTPInput = memo(function OTPInput({
    length = 6,
    value,
    onChange,
    disabled = false,
    error = false
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Convert value string to array for individual inputs
    const valueArray = value.split('').slice(0, length);
    while (valueArray.length < length) {
        valueArray.push('');
    }

    const focusInput = useCallback((index: number) => {
        if (index >= 0 && index < length) {
            inputRefs.current[index]?.focus();
        }
    }, [length]);

    const handleChange = useCallback((index: number, e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Only allow single digit
        if (inputValue.length > 1) {
            // Take only the last character (for paste handling in single input)
            const lastChar = inputValue.slice(-1);
            if (!/^\d$/.test(lastChar)) return;

            const newValue = valueArray.slice();
            newValue[index] = lastChar;
            onChange(newValue.join(''));

            // Move to next input
            if (index < length - 1) {
                focusInput(index + 1);
            }
            return;
        }

        // Single character input
        if (inputValue && !/^\d$/.test(inputValue)) return;

        const newValue = valueArray.slice();
        newValue[index] = inputValue;
        onChange(newValue.join(''));

        // Auto-advance to next input
        if (inputValue && index < length - 1) {
            focusInput(index + 1);
        }
    }, [valueArray, length, onChange, focusInput]);

    const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!valueArray[index] && index > 0) {
                // If current input is empty, move to previous and clear it
                focusInput(index - 1);
                const newValue = valueArray.slice();
                newValue[index - 1] = '';
                onChange(newValue.join(''));
                e.preventDefault();
            }
        }

        // Handle left arrow
        if (e.key === 'ArrowLeft' && index > 0) {
            focusInput(index - 1);
            e.preventDefault();
        }

        // Handle right arrow
        if (e.key === 'ArrowRight' && index < length - 1) {
            focusInput(index + 1);
            e.preventDefault();
        }
    }, [valueArray, length, onChange, focusInput]);

    const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

        if (pastedData) {
            onChange(pastedData.padEnd(length, '').slice(0, length));

            // Focus the input after the last pasted character
            const focusIndex = Math.min(pastedData.length, length - 1);
            focusInput(focusIndex);
        }
    }, [length, onChange, focusInput]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    }, []);

    return (
        <div className="otp-input-container" data-testid="otp-input">
            {valueArray.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={handleFocus}
                    disabled={disabled}
                    className={`otp-input-box ${error ? 'otp-input-error' : ''} ${digit ? 'otp-input-filled' : ''}`}
                    aria-label={`Doğrulama kodu ${index + 1}. hane`}
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );
});

export default OTPInput;
