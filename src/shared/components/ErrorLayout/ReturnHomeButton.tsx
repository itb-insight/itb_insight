"use client";

import { useRouter } from "next/navigation";
import styles from "./ReturnHomeButton.module.css";

export default function ReturnHomeButton() {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push("/")} className={styles.btn}>
      Return home
    </button>
  );
}
