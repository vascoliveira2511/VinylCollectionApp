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

interface Track {
  position: string;
  type_?: string;
  title: string;
  duration?: string;
}

interface SimpleReleaseInfoProps {
  // Basic info
  labels?: Label[];
  formats?: Format[];
  released?: string;
  master_id?: number;
  country?: string;

  // Detailed info
  companies?: Company[];
  extraartists?: ExtraArtist[];
  identifiers?: Identifier[];
  tracklist?: Track[];
  notes?: string;
}

export default function SimpleReleaseInfo(props: SimpleReleaseInfoProps) {
  const formatDiscogsNotes = (notes: string) => {
    return notes
      .replace(/\n/g, "<br/>")
      .replace(
        /\[url=(.*?)\](.*?)\[\/url\]/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">$2</a>'
      )
      .replace(
        /\[r(\d+)\]/g,
        '<a href="https://www.discogs.com/release/$1" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">[r$1]</a>'
      );
  };

  const groupCreditsByRole = (credits: ExtraArtist[]) => {
    const grouped: { [role: string]: string[] } = {};
    credits.forEach((credit) => {
      if (!grouped[credit.role]) {
        grouped[credit.role] = [];
      }
      grouped[credit.role].push(credit.name);
    });
    return grouped;
  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Basic Release Info - Always visible */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          fontSize: "0.9em",
        }}
      >
        {/* Labels */}
        {props.labels && props.labels.length > 0 && (
          <div>
            <strong>Label:</strong>
            <div style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
              {props.labels.map((label, idx) => (
                <div key={idx}>
                  {label.name} {label.catno && `– ${label.catno}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Format */}
        {props.formats && props.formats.length > 0 && (
          <div>
            <strong>Format:</strong>
            <div style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
              {props.formats.map((format, idx) => (
                <div key={idx}>
                  {format.qty && `${format.qty} x `}
                  {format.name}
                  {format.descriptions && format.descriptions.length > 0 && (
                    <div style={{ fontSize: "0.9em" }}>
                      {format.descriptions.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Country */}
        {props.country && (
          <div>
            <strong>Country:</strong>
            <div style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
              {props.country}
            </div>
          </div>
        )}

        {/* Released */}
        {props.released && (
          <div>
            <strong>Released:</strong>
            <div style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
              {props.released}
            </div>
          </div>
        )}

        {/* Master Release Link */}
        {props.master_id && (
          <div>
            <strong>Master Release:</strong>
            <div style={{ marginTop: "4px" }}>
              <Link
                href={`/browse/master/${props.master_id}`}
                style={{
                  color: "var(--primary)",
                  textDecoration: "underline",
                }}
              >
                View all versions
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Track List - Always visible */}
      {props.tracklist && props.tracklist.length > 0 && (
        <div>
          <div style={{ display: "grid", gap: "2px", fontSize: "0.85em" }}>
            {props.tracklist.map((track, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto 1fr auto",
                  gap: "12px",
                  padding: "2px 0",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "var(--text-tertiary)",
                    minWidth: "24px",
                  }}
                >
                  {track.position}
                </span>
                <span style={{ color: "var(--text)" }}>
                  {/* Extract artist from title if it contains – */}
                  {track.title.includes("–") ? (
                    <>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {track.title.split("–")[0].trim()}–
                      </span>
                      <span style={{ marginLeft: "8px" }}>
                        {track.title.split("–").slice(1).join("–").trim()}
                      </span>
                    </>
                  ) : (
                    track.title
                  )}
                </span>
                <span></span> {/* Spacer */}
                {track.duration && (
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: "var(--text-secondary)",
                      fontSize: "0.9em",
                    }}
                  >
                    {track.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credits - Always visible, grouped by role */}
      {props.extraartists && props.extraartists.length > 0 && (
        <div style={{ fontSize: "0.85em" }}>
          {Object.entries(groupCreditsByRole(props.extraartists)).map(
            ([role, artists], idx) => (
              <div key={idx} style={{ marginBottom: "4px" }}>
                <strong style={{ color: "var(--text)" }}>{role}</strong>
                <span
                  style={{ color: "var(--text-secondary)", marginLeft: "8px" }}
                >
                  – {artists.join(", ")}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* Companies - Simplified */}
      {props.companies && props.companies.length > 0 && (
        <div style={{ fontSize: "0.85em" }}>
          {props.companies.map((company, idx) => (
            <div key={idx} style={{ marginBottom: "2px" }}>
              <span style={{ color: "var(--text-secondary)" }}>
                {company.entity_type_name}
              </span>
              <span style={{ color: "var(--text)", marginLeft: "8px" }}>
                – {company.name}
                {company.catno && ` – ${company.catno}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Release Notes - Always visible */}
      {props.notes && (
        <div style={{ fontSize: "0.9em" }}>
          <strong
            style={{
              color: "var(--text)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Release Notes:
          </strong>
          <div style={{ lineHeight: "1.4", color: "var(--text-secondary)" }}>
            <div
              dangerouslySetInnerHTML={{
                __html: formatDiscogsNotes(props.notes),
              }}
            />
          </div>
        </div>
      )}

      {/* Identifiers - Simple list */}
      {props.identifiers && props.identifiers.length > 0 && (
        <div style={{ fontSize: "0.85em" }}>
          {props.identifiers.map((identifier, idx) => (
            <div key={idx} style={{ marginBottom: "2px" }}>
              <strong style={{ color: "var(--text)" }}>
                {identifier.type}
              </strong>
              <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>
                {identifier.value}
                {identifier.description && ` (${identifier.description})`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
