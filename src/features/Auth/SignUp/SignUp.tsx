import Link from "next/link"
import styles from "./SignUp.module.css"

export default function SignUp() {
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
            <h2 className={styles.title}>Sign Up</h2>
            <p className={styles.subtitle}>join the experience</p>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder=""
              />
            </div>

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

            <button className={styles.loginBtn}>Sign Up</button>

            <p className={styles.signupText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.signupLink}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}