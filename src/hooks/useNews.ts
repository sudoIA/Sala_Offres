// src/hooks/useNews.ts
// Articles "News Sala" : tous pour le back-office (temps réel), seulement les
// articles visibles pour la page publique. Tri du plus récent au plus ancien.

"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewsArticle, NewsDoc } from "@/types/news";

export function useNews(includeHidden = false) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = includeHidden ? collection(db, "news") : query(collection(db, "news"), where("visibility", "==", true));
    const unsubscribe = onSnapshot(
      source,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data() as NewsDoc;
          return { id: d.id, ...data, publishedDate: data.publishedAt?.toDate ? data.publishedAt.toDate() : null };
        });
        list.sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
        setArticles(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erreur chargement des actualités :", err);
        setError("Impossible de charger les actualités pour le moment.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [includeHidden]);

  return { articles, loading, error };
}
