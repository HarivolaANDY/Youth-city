from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import os
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
    MarketItem,
    FreelanceGig,
    FreelanceContract,
    CitizenMessage,
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
                        "practicalExercise": "Déclare un tableau `produits` contenant 3 objets représentant des articles artisanaux malgaches et écris une fonction `calculerTotal()`.",
                        "quiz": {
                            "question": "Quelle instruction déclare une variable dont la valeur ne changera pas ?",
                            "options": ["var", "let", "const", "static"],
                            "correctIndex": 2,
                            "explanation": "`const` permet de déclarer une constante dont la référence ne peut pas être réaffectée.",
                        },
                        "realWorldMission": "Intègre un sélecteur dynamique de quantité sur le panier d'un commerce en ligne d'Antananarivo.",
                    },
                    {
                        "title": "Module 2 : Gestion de versions avec Git",
                        "lessonSummary": "Git enregistre l'historique des modifications de code dans des commits. C'est l'outil standard indispensable pour collaborer sur un projet professionnel.",
                        "practicalExercise": "Initialise un dépôt git local, crée une branche `feature-panier`, prépare les fichiers modifiés et rédige un commit conventionnel.",
                        "quiz": {
                            "question": "Quelle commande prépare des fichiers modifiés pour le prochain commit ?",
                            "options": ["git push", "git add", "git checkout", "git reset"],
                            "correctIndex": 1,
                            "explanation": "`git add <fichier>` prépare les modifications dans la zone de staging.",
                        },
                        "realWorldMission": "Collabore sur le dépôt GitHub de ton équipe au City Hub sans provoquer de conflits de fusion.",
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
                        "practicalExercise": "Prends un revenu simulé de 350 000 MGA et établis le tableau mensuel des 3 enveloppes budgétaires en prévoyant les imprévus.",
                        "quiz": {
                            "question": "Si tu gagnes 400 000 MGA, combien devrais-tu épargner selon la règle des 20% ?",
                            "options": ["40 000 MGA", "80 000 MGA", "100 000 MGA", "50 000 MGA"],
                            "correctIndex": 1,
                            "explanation": "20% de 400 000 MGA = 80 000 MGA à réserver pour ton fonds de secours ou futurs investissements.",
                        },
                        "realWorldMission": "Configure ton livret d'épargne au Finance District pour automatiser un virement d'au moins 20 000 MGA chaque cycle.",
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
                        "practicalExercise": "Écris un composant `BadgeCompetence` recevant en prop le niveau en pourcentage et affichant une jauge dynamique avec Tailwind.",
                        "quiz": {
                            "question": "Quel hook standard React permet de gérer les effets secondaires (appels API, timers) ?",
                            "options": ["useState", "useEffect", "useMemo", "useContext"],
                            "correctIndex": 1,
                            "explanation": "`useEffect` sert à exécuter du code lors du montage, de la mise à jour ou du démontage du composant.",
                        },
                        "realWorldMission": "Développe un tableau de bord modulaire pour suivre les indicateurs d'une startup incubée au Startup District.",
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

        # 5. Dilemmas & Événements Dynamiques (§25 & §26)
        dilemmas_data = [
            {
                "key": "dilemma-broken-laptop",
                "title": "Panne d'ordinateur imprévue !",
                "category": "general",
                "scenario": "Ton PC portable s'éteint brusquement et ne se rallume plus. Tu en as impérativement besoin pour terminer ton module de formation et tes missions.",
                "icon": "AlertTriangle",
                "conditions": {},
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
            },
            {
                "key": "dilemma-domestic-leak",
                "title": "Aléa domestique : Dégât des eaux !",
                "category": "domestic",
                "scenario": "Une canalisation fuit abondamment sous l'évier de ton logement. L'eau menace d'endommager le plancher et d'entraîner une surconsommation facturée.",
                "icon": "Home",
                "conditions": {},
                "options": [
                    {
                        "id": "opt-plumber",
                        "text": "Faire intervenir un plombier agréé en urgence",
                        "costMoney": 65000,
                        "costEnergy": 5,
                        "gainXp": 35,
                        "impactSkills": {"budget": 5},
                        "consequenceText": "Le problème est résolu de manière impeccable en 1h. Ton logement est sécurisé sans effort supplémentaire.",
                    },
                    {
                        "id": "opt-diy",
                        "text": "Acheter un kit de joint au Market District et réparer soi-même",
                        "costMoney": 15000,
                        "costEnergy": 25,
                        "gainXp": 65,
                        "impactSkills": {"budget": 15},
                        "consequenceText": "Belle débrouillardise ! La fuite est colmatée à moindre coût, bien que tu aies dépensé une énergie précieuse.",
                    },
                    {
                        "id": "opt-landlord",
                        "text": "Contacter le propriétaire et négocier une intervention sous 48h",
                        "costMoney": 0,
                        "costEnergy": 15,
                        "gainXp": 45,
                        "impactSkills": {"communication": 15},
                        "consequenceText": "Tu fais valoir tes droits de locataire avec calme. L'intervention sera prise en charge dans deux jours.",
                    },
                ],
            },
            {
                "key": "dilemma-mentor-coffee",
                "title": "Rencontre fortuite au Café du Business District",
                "category": "career",
                "scenario": "En faisant une pause, tu échanges avec une directrice technique réputée d'Antananarivo. Impressionnée par ton profil, elle t'accorde 10 minutes d'attention.",
                "icon": "Briefcase",
                "conditions": {"min_level": 1},
                "options": [
                    {
                        "id": "opt-pitch",
                        "text": "Lui offrir un café de spécialité et lui pitcher tes projets phares",
                        "costMoney": 12000,
                        "costEnergy": 10,
                        "gainXp": 80,
                        "impactSkills": {"communication": 20, "entrepreneuriat": 15},
                        "consequenceText": "Coup de maître ! Elle te donne sa carte personnelle et te promet d'examiner ta candidature prioritairement.",
                    },
                    {
                        "id": "opt-advice",
                        "text": "Lui demander humblement ses 3 conseils clés pour un jeune débutant",
                        "costMoney": 0,
                        "costEnergy": 5,
                        "gainXp": 50,
                        "impactSkills": {"communication": 10},
                        "consequenceText": "Un échange inspirant et pragmatique qui clarifie ta feuille de route professionnelle pour les prochaines semaines.",
                    },
                    {
                        "id": "opt-audit",
                        "text": "Proposer d'analyser l'ergonomie de l'application de son entreprise ce soir",
                        "costMoney": 0,
                        "costEnergy": 30,
                        "gainXp": 110,
                        "impactSkills": {"javascript": 15, "communication": 15},
                        "consequenceText": "Engagement exemplaire par la preuve ! Ton audit soigné lui sera envoyé dès ce soir.",
                    },
                ],
            },
            {
                "key": "dilemma-inflation-groceries",
                "title": "Fluctuation des prix au Market District",
                "category": "finance",
                "scenario": "Une envolée passagère des cours des denrées alimentaires de base est constatée dans toute la ville. Ton budget repas hebdomadaire risque d'augmenter de 25%.",
                "icon": "TrendingUp",
                "conditions": {},
                "options": [
                    {
                        "id": "opt-budget-meals",
                        "text": "Ajuster son régime : cuisiner des plats locaux en gros et réduire le superflu",
                        "costMoney": 5000,
                        "costEnergy": 15,
                        "gainXp": 60,
                        "impactSkills": {"budget": 20},
                        "consequenceText": "Discipline budgétaire exemplaire ! Tu stabilises tes dépenses tout en renforçant ton indépendance culinaire.",
                    },
                    {
                        "id": "opt-bulk-coloc",
                        "text": "Organiser un panier d'achats groupés avec les voisins de quartier",
                        "costMoney": 20000,
                        "costEnergy": 10,
                        "gainXp": 70,
                        "impactSkills": {"communication": 20, "budget": 10},
                        "consequenceText": "L'entraide citoyenne paie : le tarif de gros compense l'inflation et tisse de nouveaux liens de solidarité.",
                    },
                    {
                        "id": "opt-absorb-cost",
                        "text": "Maintenir ses achats habituels et puiser dans sa réserve liquide",
                        "costMoney": 45000,
                        "costEnergy": 0,
                        "gainXp": 20,
                        "impactSkills": {"budget": -5},
                        "consequenceText": "Ton confort quotidien n'a pas varié, mais ta trésorerie accuse le coup. Surveille tes prochaines dépenses.",
                    },
                ],
            },
            {
                "key": "dilemma-company-crunch",
                "title": "Sprint d'urgence au travail : Mission commando",
                "category": "career",
                "scenario": "L'entreprise fait face à un pic d'activité imprévu pour livrer un grand client. La direction cherche des volontaires pour un shift exceptionnel ce soir avec prime substantielle.",
                "icon": "Briefcase",
                "conditions": {"has_job": True},
                "options": [
                    {
                        "id": "opt-volunteer",
                        "text": "Se porter volontaire pour le sprint nocturne avec prime au mérite",
                        "costMoney": 0,
                        "costEnergy": 35,
                        "gainXp": 90,
                        "impactSkills": {"communication": 10},
                        "consequenceText": "Shift intense mais ultra gratifiant ! Tu perçois une prime exceptionnelle de 120 000 MGA créditée sur ton solde.",
                    },
                    {
                        "id": "opt-process-opti",
                        "text": "Proposer d'automatiser une tâche redondante pour gagner 2h collectivement",
                        "costMoney": 0,
                        "costEnergy": 15,
                        "gainXp": 100,
                        "impactSkills": {"javascript": 20, "budget": 10},
                        "consequenceText": "Brillant esprit d'ingénierie ! Ton script d'automatisation soulage toute l'équipe sans heures indues.",
                    },
                    {
                        "id": "opt-decline-rest",
                        "text": "Décliner courtoisement pour préserver ton repos et ton bien-être vital",
                        "costMoney": 0,
                        "costEnergy": 0,
                        "gainXp": 30,
                        "impactSkills": {"communication": 10},
                        "consequenceText": "Tu as su poser tes limites avec professionnalisme. Tu rentres te reposer pour attaquer demain en pleine forme.",
                    },
                ],
            },
            {
                "key": "dilemma-community-hackathon",
                "title": "Opportunité City Hub : Challenge Numérique Solidaire",
                "category": "campus",
                "scenario": "Le City Hub et les universités partenaires lancent un sprint de 24h axé sur la transition écologique à Madagascar. Les meilleures équipes recevront des bourses d'études.",
                "icon": "Users",
                "conditions": {"min_level": 1},
                "options": [
                    {
                        "id": "opt-hackathon-team",
                        "text": "Former une escouade pluridisciplinaire et concourir activement",
                        "costMoney": 10000,
                        "costEnergy": 25,
                        "gainXp": 110,
                        "impactSkills": {"entrepreneuriat": 20, "communication": 15},
                        "consequenceText": "Superbe dynamique collective ! Votre projet se classe parmi les lauréats et décroche 80 000 MGA de dotation.",
                    },
                    {
                        "id": "opt-hackathon-mentor",
                        "text": "Participer comme facilitateur bénévole pour guider les plus jeunes",
                        "costMoney": 0,
                        "costEnergy": 15,
                        "gainXp": 70,
                        "impactSkills": {"communication": 25},
                        "consequenceText": "Ton leadership et ta bienveillance sont salués par les organisateurs. Tu gagnes l'estime de la communauté citoyenne.",
                    },
                    {
                        "id": "opt-hackathon-study",
                        "text": "Profiter du calme pour réviser et valider un module au Campus",
                        "costMoney": 0,
                        "costEnergy": 10,
                        "gainXp": 50,
                        "impactSkills": {"javascript": 15},
                        "consequenceText": "Choix pragmatique : tu consolides sereinement tes compétences techniques pour tes futurs objectifs.",
                    },
                ],
            },
            {
                "key": "dilemma-startup-bug",
                "title": "Alerte Startup : Bug critique en production",
                "category": "startup",
                "scenario": "Plusieurs utilisateurs de ton projet entrepreneurial signalent un problème bloquant sur la passerelle d'accès. La réputation de ta marque est en jeu !",
                "icon": "Rocket",
                "conditions": {"has_startup": True},
                "options": [
                    {
                        "id": "opt-hotfix-solo",
                        "text": "S'atteler immédiatement au débogage et déployer un correctif d'urgence",
                        "costMoney": 0,
                        "costEnergy": 30,
                        "gainXp": 100,
                        "impactSkills": {"javascript": 20, "entrepreneuriat": 10},
                        "consequenceText": "Patch déployé avec succès ! Tes utilisateurs saluent ta réactivité et ta rigueur technique.",
                    },
                    {
                        "id": "opt-freelance-help",
                        "text": "Recruter un développeur freelance senior en soutien temporaire",
                        "costMoney": 60000,
                        "costEnergy": 10,
                        "gainXp": 60,
                        "impactSkills": {"entrepreneuriat": 20},
                        "consequenceText": "Tu as su déléguer efficacement. Le bug est corrigé et tu as appris une bonne pratique d'architecture.",
                    },
                    {
                        "id": "opt-comm-transparent",
                        "text": "Publier une mise au point transparente et planifier la maintenance demain",
                        "costMoney": 0,
                        "costEnergy": 10,
                        "gainXp": 50,
                        "impactSkills": {"communication": 20},
                        "consequenceText": "La transparence inspire confiance. La communauté patiente sereinement jusqu'au déploiement du lendemain.",
                    },
                ],
            },
        ]
        for d in dilemmas_data:
            Dilemma.objects.update_or_create(
                key=d["key"],
                defaults=d
            )
        self.stdout.write("Dilemmas seeded.")

        # 5. Market Items (§11 & §19)
        market_items_data = [
            # Alimentation & Énergie
            {
                "key": "meal-street",
                "name": "Plat chaud traditionnel (Vary sy Loka)",
                "category": "food",
                "price": 5000,
                "energy_bonus": 20,
                "wellbeing_bonus": 5,
                "description": "Un repas chaud, copieux et économique dans une gargote de quartier.",
                "is_consumable": True,
                "icon": "Utensils",
            },
            {
                "key": "meal-healthy",
                "name": "Menu Équilibré & Jus de fruits frais",
                "category": "food",
                "price": 15000,
                "energy_bonus": 35,
                "wellbeing_bonus": 15,
                "description": "Produits frais locaux riches en vitamines pour recharger ses jauges au maximum.",
                "is_consumable": True,
                "icon": "Apple",
            },
            {
                "key": "snack-coffee",
                "name": "Café Robusta & Mofo Gasy énergisant",
                "category": "food",
                "price": 3000,
                "energy_bonus": 12,
                "wellbeing_bonus": 3,
                "description": "Le classique coup de fouet matinal pour attaquer ses études ou son shift.",
                "is_consumable": True,
                "icon": "Coffee",
            },

            # Équipements Pro & High-Tech
            {
                "key": "item-laptop",
                "name": "PC Portable Reconditionné Core i5",
                "category": "equipment",
                "price": 180000,
                "energy_bonus": 0,
                "wellbeing_bonus": 15,
                "description": "Machine performante pour coder, suivre les cours Campus et télétravailler en toute autonomie.",
                "is_consumable": False,
                "icon": "Laptop",
            },
            {
                "key": "item-suit",
                "name": "Tenue Professionnelle Élégante",
                "category": "equipment",
                "price": 60000,
                "energy_bonus": 0,
                "wellbeing_bonus": 20,
                "description": "Costume/tailleur de qualité renforçant la prestance et la confiance pour les entretiens.",
                "is_consumable": False,
                "icon": "Shirt",
            },

            # Mobilité & Transport
            {
                "key": "item-transport-pass",
                "name": "Pass Mensuel Bus Urbain",
                "category": "transport",
                "price": 25000,
                "energy_bonus": 10,
                "wellbeing_bonus": 10,
                "description": "Abonnement de bus évitant les trajets éreintants à pied entre les districts.",
                "is_consumable": False,
                "icon": "Bus",
            },

            # Confort Foyer & Décoration
            {
                "key": "item-desk-chair",
                "name": "Fauteuil de Bureau Ergonomique",
                "category": "lifestyle",
                "price": 45000,
                "energy_bonus": 10,
                "wellbeing_bonus": 15,
                "description": "Améliore la récupération au repos et permet d'étudier confortablement chez soi.",
                "is_consumable": False,
                "icon": "Armchair",
            },
        ]
        created_market_items = {}
        for m in market_items_data:
            item, _ = MarketItem.objects.update_or_create(
                key=m["key"],
                defaults=m
            )
            created_market_items[m["key"]] = item
        self.stdout.write(f"Market items seeded: {len(created_market_items)}")

        # 5b. Freelance Gigs & Short-Term Contracts (§52)
        freelance_gigs_data = [
            {
                "key": "gig-web-landing",
                "title": "Création de Landing Page Responsive",
                "client_name": "Artisanat Malagasy Moderne",
                "category": "tech",
                "description": "Développe une page vitrine responsive mettant en valeur les créations de vannerie et broderie malgaches auprès d'une clientèle touristique et internationale.",
                "reward_money": 120000,
                "reward_xp": 180,
                "energy_cost": 25,
                "duration_hours": 6,
                "required_skill_key": "javascript",
                "required_skill_name": "JavaScript & Développement Web",
                "min_skill_percent": 25,
                "icon": "Code",
            },
            {
                "key": "gig-seo-social",
                "title": "Audit SEO & Campagne Réseaux Sociaux",
                "client_name": "Café des Arts Antaninarenina",
                "category": "marketing",
                "description": "Optimise la fiche Google Business, la page Facebook et le compte Instagram d'un café culturel d'Antananarivo pour booster la fréquentation du week-end.",
                "reward_money": 85000,
                "reward_xp": 140,
                "energy_cost": 20,
                "duration_hours": 4,
                "required_skill_key": "communication",
                "required_skill_name": "Communication & Marketing Digital",
                "min_skill_percent": 20,
                "icon": "Megaphone",
            },
            {
                "key": "gig-excel-budget",
                "title": "Automatisation Tableur & Dashboard Trésorerie",
                "client_name": "Coopérative Vanille Sambava",
                "category": "finance",
                "description": "Conçois un fichier de suivi budgétaire automatisé avec formules de réconciliation pour sécuriser les rentrées d'argent des récoltes.",
                "reward_money": 150000,
                "reward_xp": 220,
                "energy_cost": 25,
                "duration_hours": 5,
                "required_skill_key": "budget",
                "required_skill_name": "Gestion Budgétaire & Tableur",
                "min_skill_percent": 30,
                "icon": "BarChart",
            },
            {
                "key": "gig-brand-identity",
                "title": "Charte Graphique & Pack Visuels Sociaux",
                "client_name": "GreenRide Vélo-Taxi",
                "category": "design",
                "description": "Réalise un logo vectoriel épuré, une palette de couleurs et 5 gabarits de posts réseaux sociaux pour une nouvelle startup de livraison écologique.",
                "reward_money": 175000,
                "reward_xp": 250,
                "energy_cost": 30,
                "duration_hours": 7,
                "required_skill_key": "communication",
                "required_skill_name": "Créativité & Design Visuel",
                "min_skill_percent": 35,
                "icon": "Palette",
            },
            {
                "key": "gig-translation-en-fr",
                "title": "Traduction & Localisation EN-FR de Dossier Projet",
                "client_name": "Agence Écotourisme Madagascar",
                "category": "writing",
                "description": "Traduis et adapte avec précision un document de présentation de 12 pages pour des bailleurs et partenaires anglophones.",
                "reward_money": 95000,
                "reward_xp": 150,
                "energy_cost": 20,
                "duration_hours": 4,
                "required_skill_key": "communication",
                "required_skill_name": "Rédaction & Traduction Professionnelle",
                "min_skill_percent": 20,
                "icon": "FileText",
            },
            {
                "key": "gig-database-cleanup",
                "title": "Nettoyage & Restructuration de Base Clients",
                "client_name": "Logistique Express Tana",
                "category": "tech",
                "description": "Déduplique, formate et normalise les coordonnées téléphoniques et géographiques de plus de 5000 contacts dans le système d'expédition.",
                "reward_money": 210000,
                "reward_xp": 320,
                "energy_cost": 35,
                "duration_hours": 8,
                "required_skill_key": "javascript",
                "required_skill_name": "Informatique & Données",
                "min_skill_percent": 40,
                "icon": "Database",
            },
        ]
        created_gigs_count = 0
        for g in freelance_gigs_data:
            FreelanceGig.objects.update_or_create(
                key=g["key"],
                defaults=g
            )
            created_gigs_count += 1
        self.stdout.write(f"Freelance gigs seeded: {created_gigs_count}")

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

        # Peer citizens for Annuaire & Messagerie Directe (§29)
        peer_citizens_data = [
            {
                "name": "Aina",
                "avatar_seed": "Aina",
                "title": "Designer UI/UX & Lead Graphiste",
                "level": 4,
                "xp": 980,
                "money": 380000,
                "savings": 140000,
                "day": 12,
            },
            {
                "name": "Rova",
                "avatar_seed": "Rova",
                "title": "Tech Founder & Développeur Full-Stack",
                "level": 6,
                "xp": 2350,
                "money": 890000,
                "savings": 450000,
                "day": 20,
            },
            {
                "name": "Andry",
                "avatar_seed": "Andry",
                "title": "Apprenti Comptable & Analyste Budgétaire",
                "level": 3,
                "xp": 620,
                "money": 210000,
                "savings": 90000,
                "day": 9,
            },
            {
                "name": "Mialy",
                "avatar_seed": "Mialy",
                "title": "Innovatrice Sociale & AgriTech Durable",
                "level": 4,
                "xp": 1100,
                "money": 320000,
                "savings": 110000,
                "day": 15,
            },
        ]
        created_peers = {}
        for p in peer_citizens_data:
            peer_obj, _ = Character.objects.update_or_create(
                name=p["name"],
                defaults=p
            )
            created_peers[p["name"]] = peer_obj

        # Seed initial peer messages (§29)
        if "Aina" in created_peers:
            CitizenMessage.objects.get_or_create(
                sender=created_peers["Aina"],
                recipient=character,
                defaults={
                    "content": "Salut Emmanuel ! J'ai vu que tu progressais bien en frontend au Campus. Si tu cherches une designer pour faire équipe sur le prochain Hackathon du City Hub, fais-moi signe !",
                    "context_tag": "collaboration",
                    "is_read": False,
                }
            )
        if "Rova" in created_peers:
            CitizenMessage.objects.get_or_create(
                sender=created_peers["Rova"],
                recipient=character,
                defaults={
                    "content": "Bonjour Emmanuel, bienvenue dans la communauté tech de Youth City. N'hésite pas si tu as besoin d'une revue de code sur tes projets ou des conseils sur l'architecture.",
                    "context_tag": "mentoring",
                    "is_read": False,
                }
            )

        # Default staff administrator for Back-Office (§43, §45, §46)
        if not User.objects.filter(is_superuser=True).exists():
            admin_pwd = os.getenv('DJANGO_ADMIN_PASSWORD', 'YouthCityAdmin2026!')
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@youthcity.mg',
                password=admin_pwd,
            )
            self.stdout.write(f"Default administrator '{admin_user.username}' created.")

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded Character '{character.name}' with initial balance {character.money:,} MGA."))
