// src/hooks/usePagination.ts
// Pagination générique côté client pour les grilles du back-office (offres,
// événements, annuaires...) — évite les listes interminables sur une seule
// page. `resetKey` (ex : le terme de recherche) ramène automatiquement à la
// page 1 quand il change.

"use client";

import { useEffect, useState } from "react";

export function usePagination<T>(items: T[], resetKey: unknown, pageSize = 10) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { page: currentPage, setPage, totalPages, pageItems, total: items.length };
}
