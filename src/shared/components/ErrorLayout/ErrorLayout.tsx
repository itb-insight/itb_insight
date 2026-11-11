import type { ReactNode } from "react";
import NavbarHifi from "../Navbar/NavbarHifi/NavbarHifi";
import FooterHifi from "../Footer/FooterHifi/FooterHifi";
import styles from "./ErrorLayout.module.css";

const LEFT_IMAGE = "/images/error-pattern-desktop-left.png";
const RIGHT_IMAGE = "/images/error-pattern-desktop-right.png";
const TOP_IMAGE= "/images/error-pattern-mobile-top.png";
const BOTTOM_IMAGE="/images/error-pattern-mobile-bottom.png"

export default function ErrorLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.root}>
            <div className={styles.body}>
                <picture>
                    <source media="(max-width: 768px)" srcSet={TOP_IMAGE} />
                    <img
                        src={LEFT_IMAGE}
                        alt=""
                        aria-hidden="true"
                        className={`${styles.side} ${styles.left}`}
                    />
                </picture>

                <picture>
                    <source media="(max-width: 768px)" srcSet={BOTTOM_IMAGE} />
                    <img
                        src={RIGHT_IMAGE}
                        alt=""
                        aria-hidden="true"
                        className={`${styles.side} ${styles.right}`}
                    />
                </picture>

                <NavbarHifi />

                <main className={styles.content}>{children}</main>
        </div>

            <FooterHifi />
        </div>
    )
}