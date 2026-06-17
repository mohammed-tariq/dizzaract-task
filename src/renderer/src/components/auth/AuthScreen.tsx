import { FormEvent, useState } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuthStore } from '../../stores/authStore'
import '../../assets/auth.css'

type AuthMode = 'login' | 'signup'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  autoComplete: string
  disabled: boolean
  show: boolean
  onToggleShow: () => void
  onChange: (value: string) => void
}

function PasswordField({
  id,
  label,
  value,
  autoComplete,
  disabled,
  show,
  onToggleShow,
  onChange
}: PasswordFieldProps): React.JSX.Element {
  return (
    <label htmlFor={id}>
      {label}
      <div className="auth-password-field">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={8}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={show ? 'Hide password' : 'Show password'}
          disabled={disabled}
          onClick={onToggleShow}
        >
          {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </button>
      </div>
    </label>
  )
}

export default function AuthScreen(): React.JSX.Element {
  const { login, loginWithGoogle, signup, error, clearError, status } = useAuthStore()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const isSubmitting = status === 'loading'

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode)
    clearError()
    setPassword('')
    setPasswordConfirm('')
    setShowPassword(false)
    setShowPasswordConfirm(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    clearError()

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await signup(email.trim(), password, passwordConfirm)
      }
    } catch {
      // Error state is set in the store.
    }
  }

  const handleGoogleSignIn = async (): Promise<void> => {
    clearError()
    try {
      await loginWithGoogle()
    } catch {
      // Error state is set in the store.
    }
  }

  return (
    <section className="auth-screen">
      <h1>AI Chat Desktop</h1>
      <p className="auth-screen__subtitle">
        {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
      </p>

      {mode === 'login' && (
        <>
          <button
            className="auth-oauth"
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleGoogleSignIn()}
          >
            Continue with Google
          </button>
          <div className="auth-divider">or</div>
        </>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <PasswordField
          id="auth-password"
          label="Password"
          value={password}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          disabled={isSubmitting}
          show={showPassword}
          onToggleShow={() => setShowPassword((current) => !current)}
          onChange={setPassword}
        />

        {mode === 'signup' && (
          <PasswordField
            id="auth-password-confirm"
            label="Confirm password"
            value={passwordConfirm}
            autoComplete="new-password"
            disabled={isSubmitting}
            show={showPasswordConfirm}
            onToggleShow={() => setShowPasswordConfirm((current) => !current)}
            onChange={setPasswordConfirm}
          />
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="auth-toggle">
        {mode === 'login' ? (
          <>
            No account?{' '}
            <button type="button" onClick={() => switchMode('signup')}>
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('login')}>
              Sign in
            </button>
          </>
        )}
      </p>
    </section>
  )
}
