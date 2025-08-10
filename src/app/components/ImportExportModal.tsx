"use client";

import { useState, useRef } from "react";
import { FiDownload, FiUpload, FiX, FiFileText, FiDatabase } from "react-icons/fi";
import styles from "./ImportExportModal.module.css";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Array<{ id: number; title: string; _count: { vinyls: number } }>;
  onImportComplete?: () => void;
}

export default function ImportExportModal({
  isOpen,
  onClose,
  collections,
  onImportComplete,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportCollection, setExportCollection] = useState<string>("all");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        format: exportFormat,
        collectionId: exportCollection,
      });

      const response = await fetch(`/api/export?${params}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from headers or create one
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `vinyl-collection.${exportFormat}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: "Collection exported successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to export collection. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: "error", text: "Please select a file to import." });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("overwrite", importOverwrite.toString());

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      setMessage({ type: "success", text: result.message });
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component to refresh data
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to import file. Please check the format and try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setMessage(null);
    }
  };

  const clearMessage = () => setMessage(null);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Import & Export</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Tab Navigation */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "export" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("export")}
            >
              <FiDownload size={16} />
              Export
            </button>
            <button
              className={`${styles.tab} ${activeTab === "import" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("import")}
            >
              <FiUpload size={16} />
              Import
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              <span>{message.text}</span>
              <button onClick={clearMessage} className={styles.messageClose}>
                <FiX size={14} />
              </button>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === "export" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h3>Export Format</h3>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === "csv"}
                      onChange={(e) => setExportFormat(e.target.value as "csv")}
                    />
                    <FiFileText size={16} />
                    <div>
                      <strong>CSV</strong>
                      <small>Spreadsheet format, compatible with Excel</small>
                    </div>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === "json"}
                      onChange={(e) => setExportFormat(e.target.value as "json")}
                    />
                    <FiDatabase size={16} />
                    <div>
                      <strong>JSON</strong>
                      <small>Full data format with metadata</small>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Collection to Export</h3>
                <select
                  value={exportCollection}
                  onChange={(e) => setExportCollection(e.target.value)}
                  className={styles.select}
                >
                  <option value="all">All Collections</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id.toString()}>
                      {collection.title} ({collection._count.vinyls} records)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExport}
                disabled={isProcessing}
                className={styles.primaryButton}
              >
                {isProcessing ? (
                  "Exporting..."
                ) : (
                  <>
                    <FiDownload size={16} />
                    Export Collection
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === "import" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h3>Select File</h3>
                <p className={styles.helpText}>
                  Choose a CSV or JSON file to import. Supported formats: .csv, .json
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                {importFile && (
                  <div className={styles.fileInfo}>
                    <FiFileText size={16} />
                    <span>{importFile.name}</span>
                    <button
                      onClick={() => {
                        setImportFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className={styles.removeFile}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <h3>Import Options</h3>
                <label className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={importOverwrite}
                    onChange={(e) => setImportOverwrite(e.target.checked)}
                  />
                  <div>
                    <strong>Overwrite existing records</strong>
                    <small>Update records that already exist (matching by artist, title, and year)</small>
                  </div>
                </label>
              </div>

              <div className={styles.section}>
                <h3>CSV Format Guide</h3>
                <div className={styles.formatGuide}>
                  <p>Required columns: <strong>Artist, Title</strong></p>
                  <p>Optional columns: Year, Genres, Condition, Sleeve Condition, Rating, Description, Label, Format, Purchase Date, Purchase Price, Purchase Currency, Purchase Location, Catalog Number, Country, Discogs ID, Image URL, Collection</p>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={!importFile || isProcessing}
                className={styles.primaryButton}
              >
                {isProcessing ? (
                  "Importing..."
                ) : (
                  <>
                    <FiUpload size={16} />
                    Import Records
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}