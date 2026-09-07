// src/components/cv/CvRenderRoot.tsx
// Feuille de rendu A4 du CV (capturée pour l'export PDF), qui bascule entre
// les 3 modèles selon cv.template.

import { forwardRef } from "react";
import type { CvState } from "@/types/cv";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { MarineTemplate } from "./templates/MarineTemplate";
import { ModerneTemplate } from "./templates/ModerneTemplate";

export const CvRenderRoot = forwardRef<HTMLDivElement, { data: CvState }>(function CvRenderRoot({ data }, ref) {
  return (
    <div id="cv-pdf-render" ref={ref} className={`tpl-${data.template}`}>
      {data.template === "marine" && <MarineTemplate data={data} />}
      {data.template === "moderne" && <ModerneTemplate data={data} />}
      {data.template === "classic" && <ClassicTemplate data={data} />}
    </div>
  );
});
