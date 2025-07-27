"use client";

import Link from "next/link";
import styles from "../page.module.css";

interface Label {
  name: string;
  catno?: string;
  id?: number;
}

interface Format {
  name: string;
  qty?: string;
  descriptions?: string[];
}

interface Company {
  name: string;
  catno?: string;
  entity_type?: string;
  entity_type_name?: string;
}

interface Identifier {
  type: string;
  value: string;
  description?: string;
}

interface ExtraArtist {
  name: string;
  id?: number;
  role: string;
  tracks?: string;
}

interface ReleaseInfoProps {
  labels?: Label[];
  formats?: Format[];
  released?: string;
  companies?: Company[];
  extraartists?: ExtraArtist[];
  identifiers?: Identifier[];
  master_id?: number;
  num_for_sale?: number;
  lowest_price?: number;
  showMarketplace?: boolean;
  showCredits?: boolean;
  showIdentifiers?: boolean;
}

export default function ReleaseInfo({
  labels = [],
  formats = [],
  released,
  companies = [],
  extraartists = [],
  identifiers = [],
  master_id,
  num_for_sale,
  lowest_price,
  showMarketplace = true,
  showCredits = true,
  showIdentifiers = true,
}: ReleaseInfoProps) {
  return (
    <>
      {/* Release Details - Compact Layout */}
      <div className="window" style={{ marginBottom: "20px" }}>
        <div className="title-bar">Release Information</div>
        <div className={styles.contentSection}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              fontSize: "0.85em",
            }}
          >
            {/* Labels */}
            {labels.length > 0 && (
              <div>
                <strong style={{ fontSize: "0.9em" }}>Label:</strong>
                <div style={{ marginTop: "2px" }}>
                  {labels.map((label, idx) => (
                    <div key={idx}>
                      {label.name} {label.catno && `(${label.catno})`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format */}
            {formats.length > 0 && (
              <div>
                <strong style={{ fontSize: "0.9em" }}>Format:</strong>
                <div style={{ marginTop: "2px" }}>
                  {formats.map((format, idx) => (
                    <div key={idx}>
                      {format.qty && `${format.qty}× `}
                      {format.name}
                      {format.descriptions &&
                        format.descriptions.length > 0 &&
                        `, ${format.descriptions.join(", ")}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Released */}
            {released && (
              <div>
                <strong style={{ fontSize: "0.9em" }}>Released:</strong>
                <div style={{ marginTop: "2px" }}>{released}</div>
              </div>
            )}

            {/* Master Release */}
            {master_id && (
              <div>
                <strong style={{ fontSize: "0.9em" }}>Master Release:</strong>
                <div style={{ marginTop: "2px" }}>
                  <Link
                    href={`/browse/master/${master_id}`}
                    className={styles.masterLink}
                  >
                    View all versions
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Companies - Show only key companies */}
          {companies.length > 0 && (
            <div style={{ marginTop: "15px", fontSize: "0.85em" }}>
              <strong style={{ fontSize: "0.9em" }}>Key Companies:</strong>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                {companies
                  .filter(
                    (c) =>
                      c.entity_type_name?.includes("Copyright") ||
                      c.entity_type_name?.includes("Pressed By") ||
                      c.entity_type_name?.includes("Manufactured") ||
                      c.entity_type_name?.includes("Distributed")
                  )
                  .slice(0, 4)
                  .map((company, idx) => (
                    <div key={idx}>
                      {company.name} - {company.entity_type_name}
                      {company.catno && ` (${company.catno})`}
                    </div>
                  ))}
                {companies.length > 4 && (
                  <div style={{ color: "var(--ctp-subtext1)" }}>
                    +{companies.length - 4} more companies...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Credits - Full width row */}
          {showCredits && extraartists.length > 0 && (
            <div style={{ marginTop: "15px", fontSize: "0.85em" }}>
              <strong style={{ fontSize: "0.9em" }}>Credits:</strong>
              <div
                style={{
                  display: "grid",
                  gap: "3px",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  marginTop: "4px",
                }}
              >
                {extraartists.slice(0, 8).map((artist, idx) => (
                  <div key={idx}>
                    <strong>{artist.name}</strong> - {artist.role}
                  </div>
                ))}
                {extraartists.length > 8 && (
                  <div style={{ color: "var(--ctp-subtext1)" }}>
                    +{extraartists.length - 8} more credits...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market Info */}
          {showMarketplace && (num_for_sale > 0 || lowest_price) && (
            <div style={{ marginTop: "15px", fontSize: "0.85em" }}>
              <strong style={{ fontSize: "0.9em" }}>Marketplace:</strong>
              <div style={{ marginTop: "2px" }}>
                {num_for_sale > 0 && <span>{num_for_sale} for sale</span>}
                {lowest_price && (
                  <span>
                    {num_for_sale > 0 && " • "}
                    from ${lowest_price}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Identifiers - Compact */}
      {showIdentifiers && identifiers.length > 0 && (
        <div className="window" style={{ marginBottom: "20px" }}>
          <div className="title-bar">Barcode and Other Identifiers</div>
          <div className={styles.contentSection}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
                fontSize: "0.85em",
              }}
            >
              {identifiers.map((identifier, idx) => (
                <div key={idx}>
                  <strong style={{ fontSize: "0.9em" }}>
                    {identifier.type}:
                  </strong>{" "}
                  {identifier.value}
                  {identifier.description && (
                    <span
                      style={{
                        color: "var(--ctp-subtext1)",
                        fontSize: "0.8em",
                      }}
                    >
                      {" "}
                      ({identifier.description})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
