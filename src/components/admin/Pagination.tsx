// src/components/admin/Pagination.tsx
// Barre de pagination réutilisée par les grilles du back-office.

"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="btn-icon"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Page précédente"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <span className="admin-pagination-info">
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn-icon"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Page suivante"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
}
