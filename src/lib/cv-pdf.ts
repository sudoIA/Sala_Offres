// src/lib/cv-pdf.ts
// Export PDF du CV : capture du rendu HTML en image (html2canvas) puis mise
// en page manuelle dans le PDF (jsPDF) — contourne le découpage automatique
// de html2pdf.js, qui créait une 2e page quasi vide au moindre dépassement.
// Les deux librairies ne sont importées qu'au moment de l'export (client
// uniquement), jamais au chargement de la page.

export async function exportCvToPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

  const imgWidthMm = pageWidth;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  // Marge de tolérance : un léger dépassement (jusqu'à 6mm, l'équivalent de
  // quelques lignes de texte) est simplement contenu sur la page plutôt que
  // de créer une 2e page presque vide pour presque rien.
  const TOLERANCE_MM = 6;

  if (imgHeightMm <= pageHeight + TOLERANCE_MM) {
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidthMm, imgHeightMm);
  } else {
    // Le CV dépasse réellement une page : découpage propre, page par page,
    // en rejouant la même image décalée vers le haut à chaque page.
    let heightLeft = imgHeightMm;
    let yOffset = 0;
    let isFirstPage = true;

    while (heightLeft > 0) {
      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -yOffset, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeight;
      yOffset += pageHeight;
      isFirstPage = false;
    }
  }

  pdf.save(filename);
}
