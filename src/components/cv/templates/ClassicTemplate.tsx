// src/components/cv/templates/ClassicTemplate.tsx
// Modèle "Classique Sala" : en-tête + sections empilées pleine largeur.

import type { CvState } from "@/types/cv";
import { EducationBlocks, ExperienceBlocks, HobbiesBadges, LanguagesPlain, ProjectBlocks, SkillsBadges } from "./shared";

export function ClassicTemplate({ data }: { data: CvState }) {
  return (
    <>
      <div className="cv-pdf-header">
        <div>
          <h1 className="cv-pdf-name">{data.personal.fullName || "VOTRE NOM"}</h1>
          <div className="cv-pdf-title">{(data.personal.jobTitle || "Titre du poste").toUpperCase()}</div>
          <div className="cv-pdf-contacts">
            <span><i className="fas fa-map-marker-alt me-1"></i> {data.personal.city}, {data.personal.country}</span>
            <span><i className="fas fa-envelope me-1"></i> {data.personal.email || ""}</span>
            <span><i className="fas fa-phone me-1"></i> {data.personal.phone || ""}</span>
          </div>
        </div>
        {data.personal.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cv-pdf-photo" src={data.personal.photo} alt="Photo" />
        )}
      </div>

      {data.personal.bio && (
        <div>
          <div className="cv-section-title"><i className="fas fa-user-circle"></i> Profil Professionnel</div>
          <div className="cv-item-desc">{data.personal.bio}</div>
        </div>
      )}

      {data.experiences.length > 0 && (
        <div>
          <div className="cv-section-title"><i className="fas fa-briefcase"></i> Expériences Professionnelles</div>
          <ExperienceBlocks experiences={data.experiences} />
        </div>
      )}

      {data.education.length > 0 && (
        <div>
          <div className="cv-section-title"><i className="fas fa-graduation-cap"></i> Formations &amp; Diplômes</div>
          <EducationBlocks education={data.education} />
        </div>
      )}

      {data.projects.length > 0 && (
        <div>
          <div className="cv-section-title"><i className="fas fa-tasks"></i> Projets Marquants</div>
          <ProjectBlocks projects={data.projects} />
        </div>
      )}

      <div className="row mt-2">
        <div className="col-7">
          <div className="cv-section-title"><i className="fas fa-tools"></i> Compétences Clés</div>
          <div><SkillsBadges skills={data.skills} /></div>
        </div>
        <div className="col-5">
          <div className="cv-section-title"><i className="fas fa-language"></i> Langues</div>
          <LanguagesPlain languages={data.languages} />
        </div>
      </div>

      {data.hobbies.length > 0 && (
        <div className="mt-2">
          <div className="cv-section-title"><i className="fas fa-heart"></i> Loisirs &amp; Centres d&apos;intérêt</div>
          <div><HobbiesBadges hobbies={data.hobbies} /></div>
        </div>
      )}
    </>
  );
}
