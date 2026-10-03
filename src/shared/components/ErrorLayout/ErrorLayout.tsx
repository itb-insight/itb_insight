import type { ReactNode } from "react";
import NavbarHifi from "../Navbar/NavbarHifi/NavbarHifi";
import FooterHifi from "../Footer/FooterHifi/FooterHifi";
import styles from "./ErrorLayout.module.css";

const LEFT_IMAGE = "/images/error-pattern-desktop-left.png";
const RIGHT_IMAGE = "/images/error-pattern-desktop-right.png";

export default function ErrorLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.root}>
            <div className={styles.body}>
                <img 
                    src={LEFT_IMAGE}
                    alt=""
                    aria-hidden="true"
                    className={`${styles.side} ${styles.left}`}
                />

                <img 
                    src={RIGHT_IMAGE}
                    alt=""
                    aria-hidden="true"
                    className={`${styles.side} ${styles.right}`}
                />

                <NavbarHifi />

                <main className={styles.content}>{children}</main>
        </div>

            <FooterHifi />
        </div>
    )
}