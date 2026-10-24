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
  FileCode2,
  Briefcase,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { COURSES } from '../../data/mockData';
import { useGameStore } from '../../stores/useGameStore';
import { api } from '../../services/api';
import type { Course } from '../../types/game';
import { ViewHeader } from '../../components/ui/ViewHeader';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatNumber } from '../../lib/format';

type PedagogicalStep = 'theory' | 'practice' | 'quiz' | 'mission' | 'diploma';

export const CampusView: React.FC = () => {
  const { citizen, spendMoney, completeCourseModule, addNotification } = useGameStore();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<PedagogicalStep>('theory');
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState<boolean | null>(null);
  const [quizExplanation, setQuizExplanation] = useState<string>('');
  const [isValidatingApi, setIsValidatingApi] = useState(false);

  const startCourse = (course: Course) => {
    if (citizen.completedCourses.includes(course.id)) {
      setSelectedCourse(course);
      setActiveModuleIndex(0);
      setCurrentStep('theory');
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      setIsQuizCorrect(null);
      return;
    }

    const paid = spendMoney(course.cost, `Frais de formation : ${course.title}`, 'Éducation');
    if (paid) {
      setSelectedCourse(course);
      setActiveModuleIndex(0);
      setCurrentStep('theory');
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      setIsQuizCorrect(null);
      addNotification('Inscription validée', `Tu as rejoint la formation "${course.title}".`, 'success');
    }
  };

  const activeModule = selectedCourse?.modules[activeModuleIndex];

  const handleValidateQuiz = async () => {
    if (selectedQuizAnswer === null || !selectedCourse || !activeModule) return;
    setIsValidatingApi(true);

    try {
      const res = await api.validateCourseQuiz(selectedCourse.id, activeModuleIndex, selectedQuizAnswer);
      if (res) {
        setQuizSubmitted(true);
        setIsQuizCorrect(res.isCorrect);
        setQuizExplanation(res.explanation);

        if (res.isCorrect) {
          addNotification('Bonne réponse !', 'Notion assimilée avec succès.', 'success');
          if (res.isCourseCompleted) {
            completeCourseModule(selectedCourse.id);
          }
        } else {
          addNotification('Réponse incorrecte', 'Lis attentivement l\'explication pédagogique et réessaye.', 'warning');
        }
      } else {
        // Fallback local
        fallbackLocalValidation();
      }
    } catch {
      fallbackLocalValidation();
    } finally {
      setIsValidatingApi(false);
    }
  };

  const fallbackLocalValidation = () => {
    if (!activeModule || selectedQuizAnswer === null || !selectedCourse) return;
    const correct = selectedQuizAnswer === activeModule.quiz.correctIndex;
    setQuizSubmitted(true);
    setIsQuizCorrect(correct);
    setQuizExplanation(activeModule.quiz.explanation);

    if (correct) {
      addNotification('Bonne réponse !', 'Notion assimilée avec succès.', 'success');
      if (activeModuleIndex === selectedCourse.modules.length - 1) {
        completeCourseModule(selectedCourse.id);
      }
    } else {
      addNotification('Réponse incorrecte', 'Lis attentivement l\'explication pédagogique et réessaye.', 'warning');
    }
  };

  const handleNextModuleOrDiploma = () => {
    if (!selectedCourse) return;
    if (activeModuleIndex < selectedCourse.modules.length - 1) {
      setActiveModuleIndex((prev) => prev + 1);
      setCurrentStep('theory');
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      setIsQuizCorrect(null);
      setQuizExplanation('');
    } else {
      setCurrentStep('diploma');
    }
  };

  const closeCourse = () => {
    setSelectedCourse(null);
    setCurrentStep('theory');
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setIsQuizCorrect(null);
  };

  // Sections du pipeline §23
  const pipelineSteps = [
    { key: 'theory', label: '1. Théorie', icon: BookOpen, desc: 'Apports fondamentaux synthétiques' },
    { key: 'practice', label: '2. Exercice appliqué', icon: FileCode2, desc: 'Mise en pratique guidée' },
    { key: 'quiz', label: '3. Quiz de validation', icon: HelpCircle, desc: 'Contrôle des connaissances' },
    { key: 'mission', label: '4. Mission terrain', icon: Briefcase, desc: 'Cas concret en situation réelle' },
    { key: 'diploma', label: '5. Certification', icon: Award, desc: 'Reconnaissance citoyenne' },
  ] as const;

  return (
    <div className="space-y-5 sm:space-y-6">
      <ViewHeader
        headingId="campus-title"
        tone="cool"
        badgeIcon={<GraduationCap />}
        badgeLabel="Campus District"
        meta="Pôle universitaire & formations (§7, §23)"
        title="Pipeline Pédagogique & Montée en Compétences"
        description="Chaque cursus suit l'entonnoir pédagogique officiel (§23) : cours théorique synthétique, exercice guidé, quiz de contrôle avec feedback immédiat, mission professionnelle concrète et certification inscrite à ton Career Passport."
        aside={
          <div className="panel-inset flex items-center gap-3 px-4 py-3">
            <Award className="size-6 shrink-0 text-warn-400" aria-hidden="true" />
            <div>
              <span className="block text-2xs tracking-wider text-mist-500 uppercase">Certifications validées</span>
              <span className="metric mt-1 block text-sm font-bold text-white">
                {citizen.certifications.length} diplôme(s)
              </span>
            </div>
          </div>
        }
      />

      {/* Pipeline interactif du cours sélectionné */}
      {selectedCourse && activeModule && (
        <Panel
          as="section"
          aria-labelledby="course-pipeline-heading"
          tone="cool"
          className="animate-rise-in overflow-hidden border-l-[3px] border-l-cool-400 p-5 sm:p-6"
        >
          {/* Header du module */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-cool-400">
                  {selectedCourse.category} • Module {activeModuleIndex + 1}/{selectedCourse.modules.length}
                </span>
                <span className="text-2xs text-mist-500">• Pipeline §23</span>
              </div>
              <h3 id="course-pipeline-heading" className="mt-1 text-lg font-bold text-white">
                {selectedCourse.title}
              </h3>
              <p className="mt-0.5 text-xs text-mist-300 font-medium">
                {activeModule.title}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={closeCourse}>
              <X className="size-3.5" aria-hidden="true" />
              Quitter le cours
            </Button>
          </div>

          {/* Stepper horizontal du Pipeline Pédagogique §23 */}
          <nav aria-label="Étapes du pipeline pédagogique" className="mb-6">
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {pipelineSteps.map((step) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.key;
                const isPassed =
                  (step.key === 'theory' && currentStep !== 'theory') ||
                  (step.key === 'practice' && ['quiz', 'mission', 'diploma'].includes(currentStep)) ||
                  (step.key === 'quiz' && isQuizCorrect && ['mission', 'diploma'].includes(currentStep)) ||
                  (step.key === 'mission' && currentStep === 'diploma');

                return (
                  <li key={step.key}>
                    <button
                      type="button"
                      disabled={step.key === 'diploma' && !citizen.completedCourses.includes(selectedCourse.id) && currentStep !== 'diploma'}
                      onClick={() => {
                        if (step.key === 'quiz' || step.key === 'theory' || step.key === 'practice' || (step.key === 'mission' && isQuizCorrect)) {
                          setCurrentStep(step.key);
                        }
                      }}
                      className={`flex w-full flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${
                        isActive
                          ? 'border-cool-400/80 bg-cool-500/15 text-white shadow-sm shadow-cool-950/40'
                          : isPassed
                            ? 'border-gain-400/40 bg-gain-500/10 text-gain-200'
                            : 'border-white/[0.06] bg-night-950/40 text-mist-400 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <IconComponent className={`size-3.5 shrink-0 ${isActive ? 'text-cool-400' : isPassed ? 'text-gain-400' : 'text-mist-500'}`} />
                        <span>{step.label}</span>
                      </div>
                      <span className="line-clamp-1 text-3xs text-mist-400">{step.desc}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* CONTENU SELON L'ÉTAPE DU PIPELINE */}
          {currentStep === 'theory' && (
            <div className="space-y-4">
              <div className="panel-inset p-5">
                <span className="eyebrow mb-2 flex items-center gap-2 text-cool-300">
                  <BookOpen className="size-4" aria-hidden="true" />
                  Étape 1 : Apports Fondamentaux Synthétiques
                </span>
                <p className="text-sm leading-relaxed text-mist-200">{activeModule.lessonSummary}</p>
                <div className="mt-4 rounded-lg border border-cool-500/20 bg-cool-500/5 p-3 text-xs text-mist-300">
                  <span className="font-semibold text-cool-200">Conseil d'assimilation :</span> Réfère-toi à ces notions lors du cas pratique et du quiz de validation qui suit.
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="iris" onClick={() => setCurrentStep('practice')}>
                  Passer à l'exercice d'application
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'practice' && (
            <div className="space-y-4">
              <div className="panel-inset p-5">
                <span className="eyebrow mb-2 flex items-center gap-2 text-brand-300">
                  <FileCode2 className="size-4" aria-hidden="true" />
                  Étape 2 : Exercice d'Application & Mise en Pratique Guidée
                </span>
                <p className="text-sm leading-relaxed text-white font-medium">
                  {activeModule.practicalExercise ||
                    "Applique directement la notion théorique à travers un cas pratique contextualisé à l'écosystème Youth City."}
                </p>
                <div className="mt-4 rounded-lg border border-white/[0.08] bg-night-950/60 p-4 font-mono text-xs text-mist-200">
                  <span className="text-mist-500">// Cas d'application Youth City</span>
                  <p className="mt-1 text-brand-200">
                    &gt; Prépare ton livrable dans ton environnement avant de répondre au test de contrôle.
                  </p>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep('theory')}>
                  Revoir la théorie
                </Button>
                <Button variant="iris" onClick={() => setCurrentStep('quiz')}>
                  Passer au quiz de validation
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'quiz' && (
            <div className="space-y-4">
              <div className="panel-inset p-5">
                <span className="eyebrow mb-2 flex items-center gap-2 text-warn-400">
                  <HelpCircle className="size-4" aria-hidden="true" />
                  Étape 3 : Contrôle des Connaissances (Quiz de Validation)
                </span>
                <p className="mb-4 text-sm font-bold text-white">
                  {activeModule.quiz.question}
                </p>

                <fieldset>
                  <legend className="sr-only">Choisis ta réponse au quiz</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeModule.quiz.options.map((opt, idx) => {
                      const isSelected = selectedQuizAnswer === idx;
                      let tone =
                        'border-white/[0.08] bg-white/[0.02] text-mist-300 hover:border-cool-400/40 hover:bg-white/[0.05] hover:text-white';

                      if (isSelected) tone = 'border-cool-400/60 bg-cool-500/12 text-white font-bold';
                      if (quizSubmitted) {
                        if (idx === activeModule.quiz.correctIndex) {
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
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left text-xs transition-all duration-200 ${
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
                            className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors ${
                              quizSubmitted && idx === activeModule.quiz.correctIndex
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
                    className={`mt-4 rounded-xl border p-4 text-xs ${
                      isQuizCorrect
                        ? 'border-gain-400/35 bg-gain-500/10 text-gain-200'
                        : 'border-risk-400/35 bg-risk-500/10 text-risk-200'
                    }`}
                  >
                    <p className="mb-1 font-bold">
                      {isQuizCorrect ? 'Bravo ! Réponse exacte.' : 'Ce n\'est pas la réponse attendue.'}
                    </p>
                    <p className="leading-relaxed opacity-95">
                      {quizExplanation || activeModule.quiz.explanation}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="secondary" onClick={() => setCurrentStep('practice')}>
                  Revoir l'exercice
                </Button>

                <div className="flex gap-2">
                  {!quizSubmitted ? (
                    <Button
                      variant="iris"
                      disabled={selectedQuizAnswer === null || isValidatingApi}
                      onClick={handleValidateQuiz}
                    >
                      {isValidatingApi ? 'Vérification en cours...' : 'Valider ma réponse'}
                    </Button>
                  ) : isQuizCorrect ? (
                    <Button variant="gain" onClick={() => setCurrentStep('mission')}>
                      Passer à la mission terrain
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuizSubmitted(false);
                        setSelectedQuizAnswer(null);
                        setIsQuizCorrect(null);
                      }}
                    >
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      Réessayer le quiz
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'mission' && (
            <div className="space-y-4">
              <div className="panel-inset p-5">
                <span className="eyebrow mb-2 flex items-center gap-2 text-gain-300">
                  <Briefcase className="size-4" aria-hidden="true" />
                  Étape 4 : Cas Concret & Mission Professionnelle en Situation Réelle
                </span>
                <p className="text-sm leading-relaxed text-white font-medium">
                  {activeModule.realWorldMission ||
                    "Mets en valeur ces compétences dans les offres d'emploi ou projets de startup au Business District."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gain-500/25 bg-gain-500/10 p-3.5 text-xs text-gain-100">
                  <CheckCircle2 className="size-5 shrink-0 text-gain-400" aria-hidden="true" />
                  <div>
                    <span className="font-bold">Module {activeModuleIndex + 1} validé avec succès !</span>
                    <p className="text-2xs text-gain-200/80">
                      Tes connaissances sont confirmées et directement exploitables dans les autres quartiers de Youth City.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep('quiz')}>
                  Revoir le quiz
                </Button>
                <Button variant="gain" onClick={handleNextModuleOrDiploma}>
                  {activeModuleIndex < selectedCourse.modules.length - 1 ? (
                    <>
                      Module suivant ({activeModuleIndex + 2}/{selectedCourse.modules.length})
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Délivrer ma certification officielle !
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'diploma' && (
            <div className="space-y-5 text-center">
              <div className="panel-inset border-warn-400/30 bg-gradient-to-b from-warn-500/10 to-transparent p-6 sm:p-8">
                <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-warn-400/40 bg-warn-500/20 text-warn-300 shadow-lg shadow-warn-950/40">
                  <Award className="size-8" aria-hidden="true" />
                </div>
                <Badge tone="gain" className="mb-2">
                  Cursus Validé avec Succès
                </Badge>
                <h4 className="text-xl font-bold text-white sm:text-2xl">
                  {selectedCourse.certificationName}
                </h4>
                <p className="mx-auto mt-2 max-w-md text-xs text-mist-300">
                  Délivré par le Campus District de la République de Youth City en reconnaissance de la maîtrise des compétences du programme.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {Object.entries(selectedCourse.skillsAwarded).map(([skill, gain]) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-brand-400/30 bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-200"
                    >
                      {skill.toUpperCase()} +{gain}%
                    </span>
                  ))}
                  <span className="rounded-lg border border-warn-400/30 bg-warn-500/15 px-3 py-1 text-xs font-bold text-warn-300">
                    +{selectedCourse.xpReward} XP Citoyen
                  </span>
                </div>

                <div className="mt-6 rounded-xl border border-white/[0.08] bg-night-950/60 p-4 text-xs text-mist-300">
                  <span className="font-semibold text-white">Career Passport (§35) :</span> Ce diplôme a été automatiquement rattaché à ton profil public et augmente tes chances d'embauche au Business District.
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="iris" onClick={closeCourse}>
                  Retour au catalogue des formations
                </Button>
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Catalogue des formations disponibles */}
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
                    {isCompleted ? 'Réviser le cursus (§23)' : 'S\'inscrire à la formation'}
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
