import styles from "../page.module.css";

export default function TermsOfService() {
  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.contentSection}>
          <div className={styles.legalDocument}>
            <h1 className={styles.legalTitle}>Terms of Service</h1>
            <p className={styles.legalDate}>Last updated: {new Date().toLocaleDateString()}</p>

            <div className={styles.legalSection}>
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing and using Vinyl Collection ("the Service"), you accept and agree to be bound 
                by these Terms of Service. If you do not agree to these terms, you may not use the Service.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Description of Service</h2>
              <p>
                Vinyl Collection is a web application that allows users to:
              </p>
              <ul>
                <li>Catalog and organize their vinyl record collections</li>
                <li>Rate and add personal notes to records</li>
                <li>Connect with friends and view their collections</li>
                <li>Search and discover music through integrated databases</li>
                <li>Sync with external services like Discogs</li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>User Accounts</h2>
              <p>To use the Service, you must:</p>
              <ul>
                <li>Be at least 13 years old</li>
                <li>Provide accurate and current information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Use the Service only for personal, non-commercial purposes</li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to other users' accounts</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the Service to spam or send unsolicited communications</li>
                <li>Scrape or automatically collect data from the Service</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </div>

            <div className={styles.legalSection}>
              <h2>Content and Data</h2>
              <p>
                You retain ownership of the content you add to your collection (ratings, notes, etc.). 
                However, you grant us a license to:
              </p>
              <ul>
                <li>Store and process your data to provide the Service</li>
                <li>Display your content to users you've connected with as friends</li>
                <li>Use anonymized, aggregated data to improve the Service</li>
              </ul>
              <p>
                We respect your privacy and will not share your personal data without consent, 
                except as outlined in our Privacy Policy.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Third-Party Services</h2>
              <p>
                The Service integrates with third-party services (Discogs, Spotify, Google). 
                Your use of these services is subject to their respective terms of service and privacy policies.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Service Availability</h2>
              <p>
                We strive to keep the Service available, but we do not guarantee uninterrupted access. 
                The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Termination</h2>
              <p>
                You may terminate your account at any time. We may terminate or suspend your account if you:
              </p>
              <ul>
                <li>Violate these Terms of Service</li>
                <li>Use the Service in a harmful or illegal manner</li>
                <li>Remain inactive for an extended period</li>
              </ul>
              <p>
                Upon termination, your access to the Service will cease, and we may delete your account data 
                after a reasonable period.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" without warranties of any kind. We do not guarantee that 
                the Service will be error-free, secure, or continuously available. We disclaim all warranties, 
                express or implied, including merchantability and fitness for a particular purpose.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Limitation of Liability</h2>
              <p>
                We shall not be liable for any indirect, incidental, special, consequential, or punitive 
                damages arising from your use of the Service, including loss of data, profits, or business interruption.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from any claims, damages, or expenses arising 
                from your use of the Service or violation of these Terms.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. Continued use of the Service after 
                changes constitutes acceptance of the new terms. We will notify users of material changes.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Portugal. 
                Any disputes shall be resolved in the courts of Portugal.
              </p>
            </div>

            <div className={styles.legalSection}>
              <h2>Contact Information</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at:
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