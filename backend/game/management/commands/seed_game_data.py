from django.core.management.base import BaseCommand
from game.models import (
    Property,
    Skill,
    Job,
    Course,
    Character,
    CharacterSkill,
    Certification,
    Transaction,
    Dilemma,
)

class Command(BaseCommand):
    help = "Seed initial game data for Youth City MVP (MGA currency, housing, jobs, courses, character)"

    def handle(self, *args, **options):
        self.stdout.write("--- Seeding Youth City MVP Initial Data ---")

        # 1. Housing / Properties
        properties_data = [
            {
                "key": "housing-room",
                "name": "Chambre en colocation étudiante",
                "rent_price": 70000,
                "comfort_rate": 2,
                "energy_recovery": 40,
                "description": "Une chambre simple et conviviale. Idéal pour débuter sans peser sur son budget mensuel.",
                "features": ["Cuisine partagée", "Wifi communautaire", "Faible coût"],
            },
            {
                "key": "housing-studio",
                "name": "Studio meublé City Center",
                "rent_price": 150000,
                "comfort_rate": 3,
                "energy_recovery": 60,
                "description": "Ton espace privé au cœur de la ville avec bureau de travail et calme assuré.",
                "features": ["Espace de travail dédié", "Récupération d'énergie +50%", "Proche du Campus"],
            },
            {
                "key": "housing-apartment",
                "name": "Appartement F2 avec balcon",
                "rent_price": 300000,
                "comfort_rate": 4,
                "energy_recovery": 85,
                "description": "Grand confort, vue panoramique sur Youth City et cadre de vie optimal pour décompresser.",
                "features": ["Balcon & salon spacieux", "Cuisine équipée", "Régénération d'énergie rapide"],
            },
            {
                "key": "housing-villa",
                "name": "Villa résidentielle avec jardin",
                "rent_price": 700000,
                "comfort_rate": 5,
                "energy_recovery": 100,
                "description": "Le sommet du bien-être citoyen pour les entrepreneurs confirmés et les leaders de communauté.",
                "features": ["Jardin privé & piscine", "Bien-être maximal garanti", "Prestige citoyen"],
            },
        ]
        created_properties = {}
        for p in properties_data:
            prop, _ = Property.objects.update_or_create(
                key=p["key"],
                defaults=p
            )
            created_properties[p["key"]] = prop
        self.stdout.write(f"Properties seeded: {len(created_properties)}")

        # 2. Skills
        skills_data = [
            {"key": "javascript", "name": "JavaScript", "category": "hard", "description": "Langage fondamental du web dynamique"},
            {"key": "react", "name": "React", "category": "hard", "description": "Bibliothèque frontend pour interfaces modulaires"},
            {"key": "git", "name": "Git & GitHub", "category": "hard", "description": "Contrôle de version et collaboration en équipe"},
            {"key": "budget", "name": "Budget & Épargne", "category": "life", "description": "Règle 50/30/20 et gestion financière saine"},
            {"key": "communication", "name": "Communication Pro", "category": "soft", "description": "Aisance relationnelle, synthèse et posture pro"},
            {"key": "entrepreneuriat", "name": "Entrepreneuriat", "category": "soft", "description": "Idéation, gestion de projet et agilité"},
        ]
        created_skills = {}
        for s in skills_data:
            sk, _ = Skill.objects.update_or_create(
                key=s["key"],
                defaults=s
            )
            created_skills[s["key"]] = sk
        self.stdout.write(f"Skills seeded: {len(created_skills)}")

        # 3. Courses
        courses_data = [
            {
                "key": "course-web-dev",
                "title": "Développement Web Fondamental (HTML/CSS/JS)",
                "category": "Tech",
                "duration_days": 3,
                "cost": 50000,
                "xp_reward": 150,
                "certification_name": "Certificat Développeur Web Junior",
                "skills_awarded": {"javascript": 20, "git": 15},
                "description": "Apprends à construire des pages web dynamiques et manipuler les bases du JavaScript moderne.",
                "modules": [
                    {
                        "title": "Module 1 : Les bases de JavaScript & DOM",
                        "lessonSummary": "Le JavaScript permet d'apporter de l'interactivité à une page web. On manipule des variables, des fonctions et des événements pour réagir aux clics de l'utilisateur.",
                        "quiz": {
                            "question": "Quelle instruction déclare une variable dont la valeur ne changera pas ?",
                            "options": ["var", "let", "const", "static"],
                            "correctIndex": 2,
                            "explanation": "`const` permet de déclarer une constante dont la référence ne peut pas être réaffectée.",
                        },
                    },
                    {
                        "title": "Module 2 : Gestion de versions avec Git",
                        "lessonSummary": "Git enregistre l'historique des modifications de code dans des commits. C'est l'outil standard indispensable pour collaborer sur un projet professionnel.",
                        "quiz": {
                            "question": "Quelle commande prépare des fichiers modifiés pour le prochain commit ?",
                            "options": ["git push", "git add", "git checkout", "git reset"],
                            "correctIndex": 1,
                            "explanation": "`git add <fichier>` prépare les modifications dans la zone de staging.",
                        },
                    },
                ],
            },
            {
                "key": "course-finance-budget",
                "title": "Gestion de Budget & Épargne Intelligente",
                "category": "Finance",
                "duration_days": 2,
                "cost": 20000,
                "xp_reward": 120,
                "certification_name": "Passeport Épargne & Rigueur Budgétaire",
                "skills_awarded": {"budget": 25},
                "description": "Maîtrise la règle du 50/30/20 et apprends à constituer un fonds de sécurité pour éviter le surendettement.",
                "modules": [
                    {
                        "title": "Module 1 : La règle 50/30/20",
                        "lessonSummary": "Répartis tes revenus : 50% pour les dépenses obligatoires (loyer, nourriture), 30% pour tes loisirs et bien-être, et 20% d'épargne systématique.",
                        "quiz": {
                            "question": "Si tu gagnes 400 000 MGA, combien devrais-tu épargner selon la règle des 20% ?",
                            "options": ["40 000 MGA", "80 000 MGA", "100 000 MGA", "50 000 MGA"],
                            "correctIndex": 1,
                            "explanation": "20% de 400 000 MGA = 80 000 MGA à réserver pour ton fonds de secours ou futurs investissements.",
                        },
                    },
                ],
            },
            {
                "key": "course-react-advanced",
                "title": "React & Interfaces Interactives Modernes",
                "category": "Tech",
                "duration_days": 4,
                "cost": 80000,
                "xp_reward": 220,
                "certification_name": "Certificat React Frontend Specialist",
                "skills_awarded": {"react": 30, "javascript": 15},
                "description": "Conçois des interfaces modulaires et réactives avec des composants fonctionnels et des hooks.",
                "modules": [
                    {
                        "title": "Module 1 : Hooks & State Management",
                        "lessonSummary": "Le hook useState permet de stocker l'état local d'un composant et de redéclencher un rendu fluide lorsque la donnée est mise à jour.",
                        "quiz": {
                            "question": "Quel hook standard React permet de gérer les effets secondaires (appels API, timers) ?",
                            "options": ["useState", "useEffect", "useMemo", "useContext"],
                            "correctIndex": 1,
                            "explanation": "`useEffect` sert à exécuter du code lors du montage, de la mise à jour ou du démontage du composant.",
                        },
                    },
                ],
            },
        ]
        created_courses = {}
        for c in courses_data:
            co, _ = Course.objects.update_or_create(
                key=c["key"],
                defaults=c
            )
            created_courses[c["key"]] = co
        self.stdout.write(f"Courses seeded: {len(created_courses)}")

        # 4. Jobs
        jobs_data = [
            {
                "key": "job-dev-junior",
                "title": "Développeur Web Junior",
                "company": "TechSolutions S.A.",
                "salary": 450000,
                "energy_per_shift": 20,
                "min_experience": "1 projet web validé",
                "description": "Participe à la refonte du portail client au sein d'une équipe agile de 4 personnes.",
                "interview_question": "Pourquoi devrions-nous retenir votre candidature pour ce poste chez TechSolutions ?",
                "requirements": [
                    {"skillKey": "javascript", "skillName": "JavaScript", "requiredPercent": 50},
                    {"skillKey": "git", "skillName": "Git", "requiredPercent": 40},
                ],
                "sample_answers": [
                    {
                        "text": "J'ai validé le cursus Web au Campus et développé deux applications concrètes dont je maîtrise le code et la gestion de version.",
                        "score": 95,
                        "feedback": "Excellente réponse : concrète, axée sur les preuves et la rigueur technique !",
                    },
                    {
                        "text": "J'ai juste besoin d'argent rapidement pour payer mon loyer.",
                        "score": 25,
                        "feedback": "Réponse inappropriée en entretien professionnel. Montre plutôt ta motivation pour le poste et l'entreprise.",
                    },
                ],
            },
            {
                "key": "job-frontend-react",
                "title": "Frontend Developer",
                "company": "InnovLab Studios",
                "salary": 550000,
                "energy_per_shift": 25,
                "min_experience": "6 mois d'expérience simulée ou 2 projets",
                "description": "Développe des dashboards modernes et intègre des composants graphiques interactifs.",
                "interview_question": "Comment organisez-vous votre code pour garantir une bonne maintenabilité ?",
                "requirements": [
                    {"skillKey": "javascript", "skillName": "JavaScript", "requiredPercent": 70},
                    {"skillKey": "react", "skillName": "React", "requiredPercent": 50},
                    {"skillKey": "git", "skillName": "Git", "requiredPercent": 40},
                ],
                "sample_answers": [
                    {
                        "text": "Je sépare les composants d'interface des hooks métier et j'écris du code typé proprement avec TypeScript.",
                        "score": 98,
                        "feedback": "Parfait ! Tu démontres une maturité d'ingénierie logicielle très appréciée.",
                    },
                ],
            },
            {
                "key": "job-marketing-assist",
                "title": "Assistant Communication & Médias",
                "company": "Youth Media Lab",
                "salary": 380000,
                "energy_per_shift": 15,
                "min_experience": "Débutant motivé accepté",
                "description": "Anime la communauté citoyenne, rédige des newsletters et assiste les relations partenaires.",
                "interview_question": "Quel ton recommandez-vous pour mobiliser les jeunes sur un nouveau challenge ?",
                "requirements": [
                    {"skillKey": "communication", "skillName": "Communication", "requiredPercent": 50},
                    {"skillKey": "budget", "skillName": "Budget", "requiredPercent": 30},
                ],
                "sample_answers": [
                    {
                        "text": "Un ton direct, positif et axé sur les bénéfices concrets pour leur avenir professionnel et personnel.",
                        "score": 90,
                        "feedback": "Très bonne compréhension de la cible et des dynamiques communautaires.",
                    },
                ],
            },
        ]
        created_jobs = {}
        for j in jobs_data:
            jb, _ = Job.objects.update_or_create(
                key=j["key"],
                defaults=j
            )
            created_jobs[j["key"]] = jb
        self.stdout.write(f"Jobs seeded: {len(created_jobs)}")

        # 5. Dilemmas
        dilemmas_data = [
            {
                "key": "dilemma-broken-laptop",
                "title": "Panne d'ordinateur imprévue !",
                "scenario": "Ton PC portable s'éteint brusquement et ne se rallume plus. Tu en as impérativement besoin pour terminer ton module de formation et tes missions.",
                "icon": "AlertTriangle",
                "options": [
                    {
                        "id": "opt-new",
                        "text": "Acheter un ordinateur portable neuf performant au Market District",
                        "costMoney": 400000,
                        "costEnergy": 0,
                        "gainXp": 30,
                        "impactSkills": {"budget": -10},
                        "consequenceText": "Tu as un équipement au top et ultra rapide, mais ton épargne a fondu ! Il va falloir redoubler de prudence financière.",
                    },
                    {
                        "id": "opt-repair",
                        "text": "Faire réparer l'ancien ordinateur chez un artisan local",
                        "costMoney": 90000,
                        "costEnergy": 10,
                        "gainXp": 50,
                        "impactSkills": {"budget": 15},
                        "consequenceText": "Décision économe et responsable ! L'ordinateur remarche pour une fraction du prix d'un neuf.",
                    },
                    {
                        "id": "opt-borrow",
                        "text": "Emprunter un PC à un ami citoyen pendant 3 jours",
                        "costMoney": 0,
                        "costEnergy": 15,
                        "gainXp": 40,
                        "impactSkills": {"communication": 15},
                        "consequenceText": "Tu renforces vos liens de solidarité, mais tu dois t'adapter aux horaires de disponibilité de ton ami.",
                    },
                    {
                        "id": "opt-loan",
                        "text": "Souscrire un micro-crédit au Finance District (30 000 MGA/mois)",
                        "costMoney": 0,
                        "costEnergy": 5,
                        "gainXp": 60,
                        "impactSkills": {"budget": 10},
                        "consequenceText": "Tu préserves ta trésorerie immédiate tout en découvrant la gestion d'une mensualité de crédit.",
                    },
                ],
            }
        ]
        for d in dilemmas_data:
            Dilemma.objects.update_or_create(
                key=d["key"],
                defaults=d
            )
        self.stdout.write("Dilemmas seeded.")

        # 6. Default Demo Character: Emmanuel
        character, _ = Character.objects.update_or_create(
            name="Emmanuel",
            defaults={
                "avatar_seed": "Felix",
                "title": "Apprenti Développeur & Citoyen Actif",
                "level": 5,
                "xp": 1450,
                "xp_to_next_level": 2000,
                "energy": 72,
                "wellbeing": 81,
                "money": 425000,
                "savings": 200000,
                "day": 14,
                "time_slot": "Matin (08:00)",
                "current_housing": created_properties.get("housing-studio"),
                "current_job": None,
                "current_objective": {
                    "title": "Décrocher un poste de Développeur Junior",
                    "target": "Atteindre 60% en JavaScript et valider 1 projet web",
                    "progress": 76,
                },
                "completed_courses": ["course-web-intro"],
                "completed_projects": 2,
                "completed_challenges": 4,
            }
        )

        # Character skills
        char_skills_map = {
            "javascript": 55,
            "react": 35,
            "git": 45,
            "budget": 65,
            "communication": 60,
            "entrepreneuriat": 40,
        }
        for skill_key, lvl in char_skills_map.items():
            if skill_key in created_skills:
                CharacterSkill.objects.update_or_create(
                    character=character,
                    skill=created_skills[skill_key],
                    defaults={"level_percent": lvl}
                )

        # Character certifications
        Certification.objects.get_or_create(
            character=character,
            title="Certification Fondamentaux du Web"
        )

        # Character transactions
        Transaction.objects.filter(character=character).delete()
        Transaction.objects.create(
            character=character,
            timestamp="J-1 18:00",
            label="Mission Freelance Landing Page",
            amount=100000,
            transaction_type="income",
            category="Carrière"
        )
        Transaction.objects.create(
            character=character,
            timestamp="J-2 10:00",
            label="Inscription Formation Web (Campus)",
            amount=-50000,
            transaction_type="expense",
            category="Éducation"
        )
        Transaction.objects.create(
            character=character,
            timestamp="J-3 12:00",
            label="Loyer mensuel Studio City",
            amount=-150000,
            transaction_type="expense",
            category="Logement"
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded Character '{character.name}' with initial balance {character.money:,} MGA."))
