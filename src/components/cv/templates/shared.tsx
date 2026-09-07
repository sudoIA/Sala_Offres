// src/components/cv/templates/shared.tsx
// Blocs réutilisés par les 3 modèles de CV : compétences, loisirs, listes à
// puces, expériences/formations/projets.

import { LEVEL_TO_PERCENT, toBulletLines, type CvEducation, type CvExperience, type CvLanguage, type CvProject } from "@/types/cv";

export function SkillsBadges({ skills }: { skills: string[] }) {
  if (skills.length === 0) return <span className="text-muted small">Aucune compétence listée</span>;
  return (
    <>
      {skills.map((s, i) => (
        <span className="cv-badge-skill" key={i}>{s}</span>
      ))}
    </>
  );
}

export function HobbiesBadges({ hobbies }: { hobbies: string[] }) {
  return (
    <>
      {hobbies.map((h, i) => (
        <span className="cv-badge-skill" key={i}>{h}</span>
      ))}
    </>
  );
}

export function BulletList({ text }: { text: string }) {
  const lines = toBulletLines(text);
  if (lines.length === 0) return null;
  return (
    <ul className="cv-item-list">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

export function ExperienceBlocks({ experiences, withDot }: { experiences: CvExperience[]; withDot?: boolean }) {
  return (
    <>
      {experiences.map((exp, i) => (
        <div className="mb-3 d-flex cv-entry-block" key={i}>
          {withDot && <span className="tpl-marine-timeline-dot mt-1"></span>}
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-baseline flex-wrap">
              <div className="cv-item-title">{exp.title || "Poste"}</div>
              <div className="cv-item-date">{exp.period || ""}</div>
            </div>
            <div className="cv-item-subtitle">
              {exp.company || ""} {exp.city ? `— ${exp.city}` : ""}
            </div>
            <BulletList text={exp.description} />
          </div>
        </div>
      ))}
    </>
  );
}

export function EducationBlocks({ education, withDot }: { education: CvEducation[]; withDot?: boolean }) {
  return (
    <>
      {education.map((edu, i) => (
        <div className="mb-2 d-flex cv-entry-block" key={i}>
          {withDot && <span className="tpl-marine-timeline-dot mt-1"></span>}
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-baseline flex-wrap">
              <div className="cv-item-title">{edu.degree || "Diplôme"}</div>
              <div className="cv-item-date">{edu.year || ""}</div>
            </div>
            <div className="cv-item-subtitle">
              {edu.school || ""} {edu.city ? `— ${edu.city}` : ""}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function ProjectBlocks({ projects }: { projects: CvProject[] }) {
  return (
    <>
      {projects.map((proj, i) => (
        <div className="mb-2 cv-entry-block" key={i}>
          <div className="cv-item-title">
            {proj.name} {proj.role && <>— <span className="cv-item-subtitle">{proj.role}</span></>}
          </div>
          <BulletList text={proj.description} />
        </div>
      ))}
    </>
  );
}

export function LanguagesPlain({ languages }: { languages: CvLanguage[] }) {
  return (
    <>
      {languages.map((l, i) => (
        <div className="small mb-1" key={i}>
          <strong>{l.name}</strong> : <span className="text-muted">{l.level}</span>
        </div>
      ))}
    </>
  );
}

export function LanguagesWithBars({ languages }: { languages: CvLanguage[] }) {
  return (
    <>
      {languages.map((l, i) => (
        <div className="small mb-2" key={i}>
          <div className="d-flex justify-content-between">
            <strong>{l.name}</strong>
            <span>{l.level}</span>
          </div>
          <div className="tpl-marine-lang-bar">
            <span style={{ width: `${LEVEL_TO_PERCENT[l.level] || 60}%` }}></span>
          </div>
        </div>
      ))}
    </>
  );
}
