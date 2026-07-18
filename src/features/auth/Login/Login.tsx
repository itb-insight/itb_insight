import Link from "next/link"
import styles from "./Login.module.css"

export default function Login() {
  return (
    <div className={styles.page}>
      <div className={styles.left}>
         <Link href = "/">
           <button className={styles.back}>Back</button>
         </Link>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Log in</h2>
            <p className={styles.subtitle}>Log in to join the experience</p>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                placeholder=""
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                placeholder=""
              />
            </div>

            <button className={styles.loginBtn}>Login</button>

            <p className={styles.orText}>or continue with</p>

            <button className={styles.googleBtn}>Google</button>

            <p className={styles.signupText}>
              Don&apos;t have an account?{" "}
              <Link href="/register" className={styles.signupLink}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}