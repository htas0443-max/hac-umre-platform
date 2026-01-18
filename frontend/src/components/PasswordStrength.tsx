import { memo, useMemo } from 'react';

interface PasswordStrengthProps {
    password: string;
    showChecklist?: boolean;
}

interface StrengthResult {
    score: number;
    label: string;
    color: string;
    checks: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        number: boolean;
        special: boolean;
    };
}

function calculateStrength(password: string): StrengthResult {
    const checks = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    // Calculate score (0-100)
    let score = 0;
    if (password.length > 0) score += 20;
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (checks.uppercase) score += 15;
    if (checks.lowercase) score += 15;
    if (checks.number) score += 15;
    if (checks.special) score += 15;

    // Determine label and color
    let label: string;
    let color: string;

    if (score < 30) {
        label = 'Çok Zayıf';
        color = '#EF4444';
    } else if (score < 50) {
        label = 'Zayıf';
        color = '#F97316';
    } else if (score < 70) {
        label = 'Orta';
        color = '#F59E0B';
    } else if (score < 90) {
        label = 'Güçlü';
        color = '#10B981';
    } else {
        label = 'Çok Güçlü';
        color = '#059669';
    }

    return { score, label, color, checks };
}

const PasswordStrength = memo(function PasswordStrength({
    password,
    showChecklist = false
}: PasswordStrengthProps) {
    const strength = useMemo(() => calculateStrength(password), [password]);

    if (!password) return null;

    return (
        <div className="password-strength" data-testid="password-strength">
            {/* Strength Bar */}
            <div className="password-strength-bar-container">
                <div
                    className="password-strength-bar"
                    style={{
                        width: `${strength.score}%`,
                        backgroundColor: strength.color,
                    }}
                />
            </div>

            {/* Label */}
            <div className="password-strength-label" style={{ color: strength.color }}>
                Güç: {strength.label}
            </div>

            {/* Checklist */}
            {showChecklist && (
                <ul className="password-strength-checklist">
                    <li className={strength.checks.length ? 'check-pass' : 'check-fail'}>
                        {strength.checks.length ? '✅' : '⬜'} 12+ karakter
                    </li>
                    <li className={strength.checks.uppercase ? 'check-pass' : 'check-fail'}>
                        {strength.checks.uppercase ? '✅' : '⬜'} Büyük harf
                    </li>
                    <li className={strength.checks.lowercase ? 'check-pass' : 'check-fail'}>
                        {strength.checks.lowercase ? '✅' : '⬜'} Küçük harf
                    </li>
                    <li className={strength.checks.number ? 'check-pass' : 'check-fail'}>
                        {strength.checks.number ? '✅' : '⬜'} Rakam
                    </li>
                    <li className={strength.checks.special ? 'check-pass' : 'check-fail'}>
                        {strength.checks.special ? '✅' : '⬜'} Özel karakter (!@#$%)
                    </li>
                </ul>
            )}
        </div>
    );
});

export default PasswordStrength;
export { calculateStrength };
