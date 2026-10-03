import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Clock,
  Coins,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { COURSES } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import type { Course } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatNumber } from '../../lib/format';

export const CampusView: React.FC = () => {
  const { citizen, spendMoney, completeCourseModule, addNotification } = useGameStore();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const startCourse = (course: Course) => {
    if (citizen.completedCourses.includes(course.id)) {
      setSelectedCourse(course);
      setActiveModuleIndex(0);
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      return;
    }

    const paid = spendMoney(course.cost, `Frais de formation : ${course.title}`, 'Éducation');
    if (paid) {
      setSelectedCourse(course);
      setActiveModuleIndex(0);
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      addNotification('Inscription validée', `Tu as rejoint la formation "${course.title}".`, 'success');
    }
  };

  const handleAnswerQuiz = () => {
    if (selectedQuizAnswer === null || !selectedCourse) return;
    setQuizSubmitted(true);

    const activeMod = selectedCourse.modules[activeModuleIndex];
    if (selectedQuizAnswer === activeMod.quiz.correctIndex) {
      if (activeModuleIndex < selectedCourse.modules.length - 1) {
        addNotification('Bonne réponse !', 'Passe au module suivant.', 'success');
      } else {
        completeCourseModule(selectedCourse.id);
      }
    } else {
      addNotification('Réponse incorrecte', 'Lis l\'explication pédagogique et réessaye.', 'warning');
    }
  };

  const nextModule = () => {
    if (!selectedCourse) return;
    setActiveModuleIndex((prev) => prev + 1);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  };

  const activeModule = selectedCourse?.modules[activeModuleIndex];
  const isAnswerCorrect = selectedQuizAnswer === activeModule?.quiz.correctIndex;

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="campus-title"
        tone="cool"
        badgeIcon={<GraduationCap />}
        badgeLabel="Campus District"
        meta="Pôle universitaire & formations"
        title="Développe tes compétences pratiques"
        description="Ici, pas de théorie stérile : apprends en faisant. Valide les quiz et projets pour enrichir ton Career Passport et postuler aux offres du Business District."
        aside={
          <div className="panel-inset flex items-center gap-3 px-4 py-3">
            <Award className="size-6 shrink-0 text-warn-400" aria-hidden="true" />
            <div>
              <span className="block text-2xs tracking-wider text-mist-500 uppercase">Certifications obtenues</span>
              <span className="metric mt-1 block text-sm font-bold text-white">
                {citizen.certifications.length} validée(s)
              </span>
            </div>
          </div>
        }
      />

      {selectedCourse && activeModule && (
        <Panel
          as="section"
          aria-labelledby="module-title"
          tone="cool"
          className="animate-rise-in overflow-hidden border-l-[3px] border-l-cool-400 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div className="min-w-0">
              <span className="eyebrow text-cool-400">
                Module {activeModuleIndex + 1} sur {selectedCourse.modules.length}
              </span>
              <h3 id="module-title" className="mt-1.5 text-lg font-bold text-white">
                {activeModule.title}
              </h3>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedCourse(null)}>
              <X className="size-3.5" aria-hidden="true" />
              Fermer le cours
            </Button>
          </div>

          <div className="mb-5 space-y-5">
            <div className="panel-inset p-4">
              <span className="eyebrow mb-2 flex items-center gap-2 text-brand-300">
                <BookOpen className="size-4" aria-hidden="true" />
                Notions fondamentales
              </span>
              <p className="text-sm leading-relaxed text-mist-200">{activeModule.lessonSummary}</p>
            </div>

            <div className="panel-inset p-5">
              <p className="mb-4 flex items-start gap-2.5 text-sm font-bold text-white">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-warn-400" aria-hidden="true" />
                <span>{activeModule.quiz.question}</span>
              </p>

              <fieldset>
                <legend className="sr-only">Choisis ta réponse au quiz</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeModule.quiz.options.map((opt, idx) => {
                    const isSelected = selectedQuizAnswer === idx;
                    const isCorrect = idx === activeModule.quiz.correctIndex;
                    let tone =
                      'border-white/[0.08] bg-white/[0.02] text-mist-300 hover:border-cool-400/40 hover:bg-white/[0.05] hover:text-white';

                    if (isSelected) tone = 'border-cool-400/60 bg-cool-500/12 text-white font-bold';
                    if (quizSubmitted) {
                      if (isCorrect) {
                        tone = 'border-gain-400/60 bg-gain-500/12 text-gain-200 font-bold';
                      } else if (isSelected) {
                        tone = 'border-risk-400/60 bg-risk-500/12 text-risk-200 font-bold';
                      } else {
                        tone = 'border-white/[0.06] bg-night-950/40 text-mist-500';
                      }
                    }

                    return (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left text-xs transition-all duration-200 ${
                          quizSubmitted ? 'cursor-default' : ''
                        } ${tone}`}
                      >
                        <input
                          type="radio"
                          name={`quiz-${selectedCourse.id}-${activeModuleIndex}`}
                          value={idx}
                          checked={isSelected}
                          disabled={quizSubmitted}
                          onChange={() => setSelectedQuizAnswer(idx)}
                          className="peer sr-only"
                        />
                        <span className="min-w-0 leading-relaxed">{opt}</span>
                        <span
                          aria-hidden="true"
                          className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 ${
                            quizSubmitted && isCorrect
                              ? 'border-gain-300 bg-gain-400'
                              : isSelected
                                ? 'border-cool-300 bg-cool-400'
                                : 'border-white/20'
                          }`}
                        >
                          {isSelected && <span className="size-1.5 rounded-full bg-night-950" />}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {quizSubmitted && (
                <div
                  role="status"
                  className={`mt-4 rounded-xl border p-3.5 text-xs ${
                    isAnswerCorrect
                      ? 'border-gain-400/35 bg-gain-500/10 text-gain-200'
                      : 'border-risk-400/35 bg-risk-500/10 text-risk-200'
                  }`}
                >
                  <p className="mb-1 font-bold">
                    {isAnswerCorrect ? 'Bravo ! Réponse exacte.' : 'Ce n\'est pas tout à fait ça.'}
                  </p>
                  <p className="leading-relaxed opacity-90">{activeModule.quiz.explanation}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                {!quizSubmitted ? (
                  <Button
                    variant="iris"
                    disabled={selectedQuizAnswer === null}
                    onClick={handleAnswerQuiz}
                  >
                    Valider ma réponse
                  </Button>
                ) : isAnswerCorrect ? (
                  activeModuleIndex < selectedCourse.modules.length - 1 ? (
                    <Button variant="gain" onClick={nextModule}>
                      Module suivant
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button variant="gain" onClick={() => setSelectedCourse(null)}>
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Terminer le cours &amp; recevoir le certificat
                    </Button>
                  )
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedQuizAnswer(null);
                    }}
                  >
                    Réessayer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Panel>
      )}

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COURSES.map((course) => {
          const isCompleted = citizen.completedCourses.includes(course.id);

          return (
            <li key={course.id} className="h-full">
              <Panel
                tone={isCompleted ? 'gain' : 'neutral'}
                className={`flex h-full flex-col p-5 transition-[transform,border-color] duration-300 ease-soft hover:-translate-y-1 ${
                  isCompleted ? '' : 'hover:border-cool-400/40'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <Badge tone="cool">{course.category}</Badge>
                    {isCompleted && (
                      <Badge tone="gain" icon={<CheckCircle2 />}>
                        Certifié
                      </Badge>
                    )}
                  </div>

                  <h3 className="mb-2 text-base leading-snug font-bold text-white">{course.title}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-mist-400">{course.description}</p>

                  <div className="panel-inset mb-4 p-3">
                    <span className="eyebrow mb-2 block">Compétences acquises</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(course.skillsAwarded).map(([skill, val]) => (
                        <span
                          key={skill}
                          className="rounded-md border border-brand-400/20 bg-brand-500/10 px-2 py-0.5 text-2xs font-semibold text-brand-200"
                        >
                          {skill} +{val}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/[0.07] pt-3.5 text-xs">
                    <span className="flex items-center gap-1 text-mist-500">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {course.durationDays} j. virtuels
                    </span>
                    <span className="metric flex items-center gap-1 font-bold text-gain-400">
                      <Coins className="size-3.5" aria-hidden="true" />
                      {isCompleted ? 'Validé' : `${formatNumber(course.cost)} MGA`}
                    </span>
                    <span className="metric flex items-center gap-1 font-bold text-warn-300">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      +{course.xpReward} XP
                    </span>
                  </div>

                  <Button
                    variant={isCompleted ? 'secondary' : 'iris'}
                    block
                    onClick={() => startCourse(course)}
                  >
                    <BookOpen className="size-4" aria-hidden="true" />
                    {isCompleted ? 'Réviser les leçons' : 'S\'inscrire à la formation'}
                  </Button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
