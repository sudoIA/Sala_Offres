// src/components/cv/templates/MarineTemplate.tsx
// Modèle "Sidebar Marine" : colonne latérale bleu marine pleine hauteur.

import type { CvState } from "@/types/cv";
import { EducationBlocks, ExperienceBlocks, HobbiesBadges, LanguagesWithBars, ProjectBlocks, SkillsBadges } from "./shared";

export function MarineTemplate({ data }: { data: CvState }) {
  return (
    <>
      <div className="tpl-marine-sidebar">
        {data.personal.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="tpl-marine-photo" src={data.personal.photo} alt="Photo" />
        )}
        {data.personal.bio && (
          <>
            <div className="cv-section-title">Profil</div>
            <div className="cv-item-desc mb-3">{data.personal.bio}</div>
          </>
        )}
        <div className="cv-section-title">Contact</div>
        <div className="cv-pdf-contacts mb-3">
          {data.personal.phone && <span><i className="fas fa-phone"></i> {data.personal.phone}</span>}
          {data.personal.email && <span><i className="fas fa-envelope"></i> {data.personal.email}</span>}
          <span><i className="fas fa-map-marker-alt"></i> {data.personal.city}{data.personal.address ? `, ${data.personal.address}` : ""}</span>
        </div>
        {data.skills.length > 0 && (
          <>
            <div className="cv-section-title">Compétences</div>
            <div className="mb-3"><SkillsBadges skills={data.skills} /></div>
          </>
        )}
        {data.languages.length > 0 && (
          <>
            <div className="cv-section-title">Langues</div>
            <LanguagesWithBars languages={data.languages} />
          </>
        )}
        {data.hobbies.length > 0 && (
          <>
            <div className="cv-section-title">Loisirs</div>
            <div className="mb-2"><HobbiesBadges hobbies={data.hobbies} /></div>
          </>
        )}
      </div>
      <div className="tpl-marine-main">
        <h1 className="cv-pdf-name">{data.personal.fullName || "VOTRE NOM"}</h1>
        <div className="cv-pdf-title">{(data.personal.jobTitle || "Titre du poste").toUpperCase()}</div>
        {data.experiences.length > 0 && (
          <div className="mt-3">
            <div className="cv-section-title"><i className="fas fa-briefcase"></i> Expériences Professionnelles</div>
            <ExperienceBlocks experiences={data.experiences} withDot />
          </div>
        )}
        {data.education.length > 0 && (
          <div>
            <div className="cv-section-title"><i className="fas fa-graduation-cap"></i> Formations &amp; Diplômes</div>
            <EducationBlocks education={data.education} withDot />
          </div>
        )}
        {data.projects.length > 0 && (
          <div>
            <div className="cv-section-title"><i className="fas fa-tasks"></i> Projets Marquants</div>
            <ProjectBlocks projects={data.projects} />
          </div>
        )}
      </div>
    </>
  );
}
