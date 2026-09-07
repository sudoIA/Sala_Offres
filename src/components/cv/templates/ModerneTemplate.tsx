// src/components/cv/templates/ModerneTemplate.tsx
// Modèle "Moderne 2 colonnes" : bandeau clair + colonnes compétences/expériences.

import type { CvState } from "@/types/cv";
import { EducationBlocks, ExperienceBlocks, HobbiesBadges, LanguagesPlain, ProjectBlocks, SkillsBadges } from "./shared";

export function ModerneTemplate({ data }: { data: CvState }) {
  return (
    <>
      <div className="tpl-moderne-header">
        {data.personal.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="tpl-moderne-photo" src={data.personal.photo} alt="Photo" />
        )}
        <div>
          <h1 className="cv-pdf-name" style={{ fontSize: 22 }}>{data.personal.fullName || "VOTRE NOM"}</h1>
          <div className="cv-pdf-title">{(data.personal.jobTitle || "Titre du poste").toUpperCase()}</div>
          <div className="cv-pdf-contacts">
            <span><i className="fas fa-map-marker-alt me-1"></i> {data.personal.city}</span>
            <span><i className="fas fa-envelope me-1"></i> {data.personal.email || ""}</span>
            <span><i className="fas fa-phone me-1"></i> {data.personal.phone || ""}</span>
          </div>
        </div>
      </div>
      <div className="tpl-moderne-body">
        <div className="tpl-moderne-col1">
          {data.skills.length > 0 && (
            <>
              <div className="cv-section-title">Compétences</div>
              <div className="mb-3"><SkillsBadges skills={data.skills} /></div>
            </>
          )}
          {data.languages.length > 0 && (
            <>
              <div className="cv-section-title">Langues</div>
              <LanguagesPlain languages={data.languages} />
            </>
          )}
          {data.projects.length > 0 && (
            <>
              <div className="cv-section-title mt-2">Projets</div>
              <ProjectBlocks projects={data.projects} />
            </>
          )}
          {data.hobbies.length > 0 && (
            <>
              <div className="cv-section-title mt-2">Loisirs</div>
              <div><HobbiesBadges hobbies={data.hobbies} /></div>
            </>
          )}
        </div>
        <div className="tpl-moderne-col2">
          {data.personal.bio && (
            <>
              <div className="cv-section-title">Profil</div>
              <div className="cv-item-desc mb-2">{data.personal.bio}</div>
            </>
          )}
          {data.experiences.length > 0 && (
            <>
              <div className="cv-section-title"><i className="fas fa-briefcase"></i> Expériences</div>
              <ExperienceBlocks experiences={data.experiences} />
            </>
          )}
          {data.education.length > 0 && (
            <>
              <div className="cv-section-title"><i className="fas fa-graduation-cap"></i> Formations</div>
              <EducationBlocks education={data.education} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
