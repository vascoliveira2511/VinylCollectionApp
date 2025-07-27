"use client";

import { useState } from "react";
import styles from "../page.module.css";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="window" style={{ marginBottom: "20px" }}>
      <div
        className="title-bar"
        style={{ cursor: "pointer" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && `${icon} `}
        {title} {isOpen ? "▲" : "▼"}
      </div>
      {isOpen && <div className={styles.contentSection}>{children}</div>}
    </div>
  );
}
