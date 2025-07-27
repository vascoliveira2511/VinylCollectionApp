"use client";

import { useState } from "react";
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

interface Video {
  uri: string;
  title: string;
  description?: string;
  duration?: number;
}

interface ModernReleaseInfoProps {
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
  videos?: Video[];
  notes?: string;
  
  // Market info
  num_for_sale?: number;
  lowest_price?: number;
}

export default function ModernReleaseInfo(props: ModernReleaseInfoProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'credits' | 'tracks'>('overview');

  const formatDiscogsNotes = (notes: string) => {
    return notes
      .replace(/\n/g, "<br/>")
      .replace(
        /\[url=(.*?)\](.*?)\[\/url\]/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--ctp-mauve);">$2</a>'
      )
      .replace(
        /\[r(\d+)\]/g,
        '<a href="https://www.discogs.com/release/$1" target="_blank" rel="noopener noreferrer" style="color: var(--ctp-mauve);">[r$1]</a>'
      );
  };

  return (
    <div className="window" style={{ marginBottom: "20px" }}>
      <div className="title-bar">Release Information</div>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        borderBottom: "1px solid var(--ctp-surface2)",
        backgroundColor: "var(--ctp-surface0)"
      }}>
        {[
          { key: 'overview', label: '📋 Overview', count: '' },
          { key: 'details', label: '🏢 Details', count: props.companies?.length || 0 },
          { key: 'credits', label: '👥 Credits', count: props.extraartists?.length || 0 },
          { key: 'tracks', label: '🎵 Tracks', count: props.tracklist?.length || 0 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: "12px 16px",
              border: "none",
              backgroundColor: activeTab === tab.key ? "var(--ctp-surface1)" : "transparent",
              color: activeTab === tab.key ? "var(--ctp-text)" : "var(--ctp-subtext1)",
              cursor: "pointer",
              fontSize: "0.9em",
              borderBottom: activeTab === tab.key ? "2px solid var(--ctp-mauve)" : "2px solid transparent",
              transition: "all 0.2s ease"
            }}
          >
            {tab.label} {tab.count > 0 && <span style={{ color: "var(--ctp-subtext1)" }}>({tab.count})</span>}
          </button>
        ))}
      </div>

      <div className={styles.contentSection}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            {/* Basic Release Info */}
            <div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>📀 Release Details</h3>
              <div style={{ display: "grid", gap: "8px", fontSize: "0.9em" }}>
                {props.labels && props.labels.length > 0 && (
                  <div>
                    <strong>Label:</strong>
                    <div style={{ marginTop: "2px", color: "var(--ctp-subtext1)" }}>
                      {props.labels.map((label, idx) => (
                        <div key={idx}>
                          {label.name} {label.catno && <span style={{ color: "var(--ctp-overlay0)" }}>({label.catno})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {props.formats && props.formats.length > 0 && (
                  <div>
                    <strong>Format:</strong>
                    <div style={{ marginTop: "2px", color: "var(--ctp-subtext1)" }}>
                      {props.formats.map((format, idx) => (
                        <div key={idx}>
                          {format.qty && `${format.qty}× `}{format.name}
                          {format.descriptions && format.descriptions.length > 0 && 
                            <span style={{ color: "var(--ctp-overlay0)" }}> • {format.descriptions.join(", ")}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {props.released && (
                  <div>
                    <strong>Released:</strong>
                    <div style={{ marginTop: "2px", color: "var(--ctp-subtext1)" }}>{props.released}</div>
                  </div>
                )}
                
                {props.country && (
                  <div>
                    <strong>Country:</strong>
                    <div style={{ marginTop: "2px", color: "var(--ctp-subtext1)" }}>{props.country}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Market Info */}
            {(props.num_for_sale > 0 || props.lowest_price) && (
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>💰 Marketplace</h3>
                <div style={{ fontSize: "0.9em" }}>
                  {props.num_for_sale > 0 && (
                    <div style={{ color: "var(--ctp-subtext1)", marginBottom: "4px" }}>
                      <strong>{props.num_for_sale}</strong> copies for sale
                    </div>
                  )}
                  {props.lowest_price && (
                    <div style={{ color: "var(--ctp-green)" }}>
                      <strong>From ${props.lowest_price}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Identifiers */}
            {props.identifiers && props.identifiers.length > 0 && (
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>🏷️ Identifiers</h3>
                <div style={{ display: "grid", gap: "4px", fontSize: "0.85em" }}>
                  {props.identifiers.slice(0, 4).map((identifier, idx) => (
                    <div key={idx} style={{ color: "var(--ctp-subtext1)" }}>
                      <strong style={{ color: "var(--ctp-text)" }}>{identifier.type}:</strong> {identifier.value}
                    </div>
                  ))}
                  {props.identifiers.length > 4 && (
                    <div style={{ color: "var(--ctp-overlay0)", fontSize: "0.8em" }}>
                      +{props.identifiers.length - 4} more identifiers
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>🔗 Links</h3>
              <div style={{ display: "grid", gap: "6px" }}>
                {props.master_id && (
                  <Link 
                    href={`/browse/master/${props.master_id}`} 
                    style={{ 
                      color: "var(--ctp-blue)", 
                      textDecoration: "none",
                      fontSize: "0.9em"
                    }}
                  >
                    👑 View all versions
                  </Link>
                )}
                {props.videos && props.videos.length > 0 && (
                  <span style={{ color: "var(--ctp-subtext1)", fontSize: "0.9em" }}>
                    🎬 {props.videos.length} video{props.videos.length !== 1 ? 's' : ''} available
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              {props.companies && props.companies.length > 0 && (
                <div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>🏢 Companies</h3>
                  <div style={{ display: "grid", gap: "6px", fontSize: "0.85em" }}>
                    {props.companies.map((company, idx) => (
                      <div key={idx} style={{ 
                        padding: "6px",
                        backgroundColor: "var(--ctp-surface0)",
                        borderRadius: "4px",
                        border: "1px solid var(--ctp-surface2)"
                      }}>
                        <div style={{ fontWeight: "bold", color: "var(--ctp-text)" }}>{company.name}</div>
                        <div style={{ color: "var(--ctp-subtext1)", fontSize: "0.9em" }}>
                          {company.entity_type_name}
                          {company.catno && ` • ${company.catno}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {props.notes && (
                <div>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>📝 Release Notes</h3>
                  <div 
                    style={{ 
                      backgroundColor: "var(--ctp-surface0)",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "0.9em",
                      lineHeight: "1.4",
                      color: "var(--ctp-subtext1)"
                    }}
                    dangerouslySetInnerHTML={{ __html: formatDiscogsNotes(props.notes) }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && props.extraartists && props.extraartists.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>👥 Credits</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
              {props.extraartists.map((artist, idx) => (
                <div key={idx} style={{ 
                  padding: "8px 12px",
                  backgroundColor: "var(--ctp-surface0)",
                  borderRadius: "6px",
                  border: "1px solid var(--ctp-surface2)"
                }}>
                  <div style={{ fontWeight: "bold", color: "var(--ctp-text)", fontSize: "0.9em" }}>
                    {artist.name}
                  </div>
                  <div style={{ color: "var(--ctp-subtext1)", fontSize: "0.85em" }}>
                    {artist.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks Tab */}
        {activeTab === 'tracks' && props.tracklist && props.tracklist.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1em", color: "var(--ctp-mauve)" }}>🎵 Track Listing</h3>
            <div style={{ display: "grid", gap: "2px" }}>
              {props.tracklist.map((track, index) => (
                <div key={index} style={{ 
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "12px",
                  padding: "8px 12px",
                  backgroundColor: index % 2 === 0 ? "var(--ctp-surface0)" : "transparent",
                  borderRadius: "4px",
                  alignItems: "center"
                }}>
                  <span style={{ 
                    fontFamily: "monospace",
                    fontSize: "0.85em",
                    color: "var(--ctp-overlay1)",
                    minWidth: "30px"
                  }}>
                    {track.position}
                  </span>
                  <span style={{ fontSize: "0.9em", color: "var(--ctp-text)" }}>
                    {track.title}
                  </span>
                  {track.duration && (
                    <span style={{ 
                      fontFamily: "monospace",
                      fontSize: "0.85em",
                      color: "var(--ctp-subtext1)"
                    }}>
                      {track.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}