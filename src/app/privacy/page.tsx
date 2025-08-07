import styles from "../page.module.css";

export default function PrivacyPolicy() {
  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.contentSection}>
          <div className={styles.legalDocument}>
            <h1 className={styles.legalTitle}>Privacy Policy</h1>
            <p className={styles.legalDate}>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <div className={styles.legalSection}>
              <h2>Information We Collect</h2>
              <p>
                When you use Vinyl Collection, we collect the following
                information:
              </p>
              <ul>
                <li>
                  <strong>Account Information:</strong> Username, email address
                  (when signing up or using Google OAuth)
                </li>
                <li>
                  <strong>Profile Information:</strong> Avatar/profile picture,
                  personal notes about records
                </li>
                <li>
                  <strong>Collection Data:</strong> Your vinyl records, ratings,
                  conditions, and personal notes
                </li>
                <li>
                  <strong>Usage Data:</strong> How you interact with the
                  application (anonymized)
                </li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>
                  Provide and maintain your vinyl collection management service
                </li>
                <li>
                  Allow you to connect with friends and view their collections
                </li>
                <li>
                  Sync with external services like Discogs (with your
                  permission)
                </li>
                <li>Improve our application and user experience</li>
                <li>
                  Send you important service updates (not promotional emails)
                </li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal
                information to third parties, except:
              </p>
              <ul>
                <li>
                  With your explicit consent (e.g., sharing collections with
                  friends)
                </li>
                <li>When required by law or legal process</li>
                <li>To protect our rights, property, or safety</li>
                <li>
                  With service providers who help us operate the application
                  (under strict confidentiality agreements)
                </li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>Third-Party Services</h2>
              <p>Our application integrates with:</p>
              <ul>
                <li>
                  <strong>Google OAuth:</strong> For authentication (subject to
                  Google's Privacy Policy)
                </li>
                <li>
                  <strong>Discogs:</strong> For music database access (subject
                  to Discogs' Privacy Policy)
                </li>
                <li>
                  <strong>Spotify:</strong> For music previews (subject to
                  Spotify's Privacy Policy)
                </li>
              </ul>
              <p>
                These services have their own privacy policies and we are not
                responsible for their practices.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Data Security</h2>
              <p>
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. However, no method of transmission
                over the internet is 100% secure.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your collection data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>Cookies</h2>
              <p>
                We use essential cookies to maintain your login session and
                application preferences. We do not use tracking cookies or
                third-party advertising cookies.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13. We do not
                knowingly collect personal information from children under 13.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify users of any material changes by posting the new policy
                on this page and updating the "Last updated" date.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact
                us at:
                <br />
                Email: vascoliveira2511@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
