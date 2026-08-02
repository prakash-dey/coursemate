import { authErrorMessage } from "@/lib/auth";
import { signInWithGoogle } from "./actions";
import styles from "./auth.module.css";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error ? authErrorMessage(params.error) : null;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="brand"><span className="brand-mark">C</span><span>CourseMate</span></div>
        <p className="overline">YOUR LEARNING WORKSPACE</p>
        <h1 id="auth-heading">Turn your material into a course.</h1>
        <p>Upload your notes, ask grounded questions, and test what you know.</p>
        {error && <div className="error" role="alert">{error}</div>}
        <form action={signInWithGoogle}>
          <button className={styles.googleButton} type="submit">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z" />
              <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 3.9 1.5l2.9-2.8A9.8 9.8 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 5.9Z" />
            </svg>
            Continue with Google
          </button>
        </form>
        <p className={styles.footnote}>Google is the only sign-in method. Course data remains private to your account.</p>
      </section>
    </main>
  );
}
