import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.vinylIcon}></div>
            </div>
            <div className={styles.footerBrandText}>
              <h3>Vinyl Collection</h3>
              <p>Organize your music, one record at a time</p>
            </div>
          </div>
        </div>

        <div className={styles.footerSection}>
          <h4>Legal</h4>
          <ul className={styles.footerLinks}>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h4>Support</h4>
          <ul className={styles.footerLinks}>
            <li>
              <a href="mailto:vascoliveira2511@gmail.com">Contact Us</a>
            </li>
            <li>
              <a
                href="https://github.com/vascoliveira2511/VinylCollectionApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h4>Connect</h4>
          <p className={styles.footerDescription}>
            Built with ♪ for vinyl enthusiasts
          </p>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContent}>
          <p>
            &copy; {new Date().getFullYear()} Vinyl Collection. All rights
            reserved.
          </p>
          <p className={styles.footerCredit}>
            Made with <span className={styles.heart}>♥</span> by Vasco Oliveira
          </p>
        </div>
      </div>
    </footer>
  );
}
