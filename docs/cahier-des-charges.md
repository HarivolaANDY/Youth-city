# YOUTH CITY --- Cahier des charges fonctionnel et technique

**Slogan proposé :** *Apprends la vie. Construis ton avenir.*

**Version du document :** 1.2 (§48 : décisions de mise en œuvre ; §49 : maintenabilité et qualité)\
**Type de produit :** plateforme web interactive, éducative et gamifiée\
**Public principal :** jeunes de 15 à 30 ans\
**Marché de lancement envisagé :** Madagascar, avec une architecture
extensible à d'autres pays

------------------------------------------------------------------------

## 1. Présentation générale

### 1.1. Nom du projet

**YOUTH CITY**

### 1.2. Concept

YOUTH CITY est une plateforme web interactive qui représente une ville
virtuelle dans laquelle les jeunes peuvent expérimenter différentes
situations de la vie réelle dans un environnement simulé et sécurisé.

L'utilisateur crée un personnage et construit progressivement son
parcours. Il peut apprendre, développer ses compétences, rechercher un
emploi, gérer un budget, trouver un logement, créer des projets, lancer
une entreprise virtuelle, collaborer avec d'autres joueurs et prendre
des décisions dont il observe les conséquences.

Le produit ne cherche pas à reproduire parfaitement la vie réelle. Il
vise à créer un environnement d'apprentissage expérientiel, accessible
et motivant.

### 1.3. Promesse du produit

> Et si un jeune pouvait apprendre à gérer sa vie adulte sans risquer de
> vraies conséquences ?

YOUTH CITY transforme des notions abstraites --- budget, employabilité,
organisation, entrepreneuriat, collaboration et prise de décision --- en
expériences concrètes.

Exemple de simulation budgétaire :

  Poste                       Montant
  ------------------- ---------------
  Salaire virtuel          350 000 Ar
  Loyer                    120 000 Ar
  Nourriture                80 000 Ar
  Téléphone                 30 000 Ar
  Transport                 50 000 Ar
  **Solde restant**     **70 000 Ar**

Le joueur doit décider comment utiliser le solde : épargner, financer
une formation, acheter un objet, investir dans un projet simulé ou
conserver une réserve.

### 1.4. Slogans alternatifs

-   Ta vie. Tes choix. Ta ville.
-   Joue aujourd'hui. Prépare demain.
-   Construis la vie que tu veux.
-   La ville où tu apprends à devenir adulte.

------------------------------------------------------------------------

## 2. Vision et objectifs

### 2.1. Vision

Faire de YOUTH CITY un environnement numérique dans lequel les jeunes
peuvent découvrir des possibilités, tester des décisions, apprendre des
compétences utiles et construire progressivement un projet de vie.

### 2.2. Objectif principal

Permettre aux jeunes de développer des compétences utiles à la vie
réelle grâce à la simulation, à la pratique et à la réflexion sur les
conséquences de leurs décisions.

### 2.3. Objectifs secondaires

La plateforme doit contribuer au développement de :

-   la culture financière ;
-   l'orientation scolaire et professionnelle ;
-   l'employabilité ;
-   l'esprit entrepreneurial ;
-   la gestion du temps ;
-   la prise de décision ;
-   la résolution de problèmes ;
-   la communication et la collaboration ;
-   l'autonomie ;
-   les compétences numériques.

------------------------------------------------------------------------

## 3. Public cible

### 3.1. Cœur de cible

Jeunes de **15 à 30 ans**, notamment :

-   lycéens ;
-   étudiants ;
-   jeunes diplômés ;
-   jeunes travailleurs ;
-   personnes en recherche d'emploi ;
-   jeunes entrepreneurs ;
-   freelances ;
-   personnes en recherche d'orientation.

### 3.2. Utilisateurs secondaires

-   établissements scolaires ;
-   universités ;
-   associations ;
-   ONG ;
-   structures d'accompagnement ;
-   incubateurs ;
-   entreprises ;
-   organismes de formation.

### 3.3. Adaptation au contexte local

Pour le lancement à Madagascar, les scénarios devront pouvoir intégrer
des réalités locales : monnaie en ariary, coûts de transport et de
logement, accès aux formations, stages, bourses, entrepreneuriat,
freelancing, langues et situations professionnelles locales.

Les montants et données économiques devront être configurables et
présentés comme des valeurs de simulation, non comme des statistiques
officielles ou des conseils financiers.

------------------------------------------------------------------------

## 4. Principes fondamentaux du produit

1.  **Learning by doing :** l'utilisateur apprend principalement en
    réalisant des actions.
2.  **Conséquences visibles :** les décisions modifient l'état du
    personnage, ses ressources ou son parcours.
3.  **Progression :** chaque activité doit contribuer à une progression
    compréhensible.
4.  **Réalisme accessible :** les scénarios doivent être crédibles sans
    devenir inutilement complexes.
5.  **Liberté de parcours :** il n'existe pas une seule manière de
    réussir.
6.  **Pédagogie avant compétition :** les classements et récompenses ne
    doivent pas remplacer l'apprentissage.
7.  **Transparence :** les ressources, salaires, crédits et
    investissements du jeu sont virtuels.

------------------------------------------------------------------------

## 5. Architecture fonctionnelle de la ville

La ville est organisée en quartiers thématiques. Chaque quartier
représente un domaine de la vie.

``` text
                         YOUTH CITY
                              |
        +---------------------+---------------------+
        |                     |                     |
      CAMPUS                BUSINESS             RESIDENTIAL
        |                     |                     |
    Universités            Entreprises            Logements
    Formations             Startups               Colocations
    Bibliothèque           Coworking              Quartiers
        |                     |                     |
        +-------------+-------+-------+-------------+
                      |               |
                   FINANCE           MARKET
                      |               |
                    Banque          Commerce
                    Épargne         Services
                      |               |
                      +-------+-------+
                              |
                           CITY HUB
                              |
                    Social et événements
                              |
                       STARTUP DISTRICT
                              |
                      Projets et entreprises
```

### 5.1. Campus District

Quartier consacré à l'éducation et au développement des compétences.

Fonctionnalités :

-   universités et écoles virtuelles ;
-   formations courtes ;
-   bibliothèque et ressources ;
-   exercices et quiz ;
-   examens ;
-   certifications internes ;
-   challenges éducatifs ;
-   événements étudiants.

Exemple de formation :

  Élément       Valeur simulée
  ------------- --------------------------------
  Formation     Développement Web
  Durée         30 jours virtuels
  Coût          50 000 Ar virtuels
  Compétences   HTML, CSS, JavaScript
  Évaluation    Exercices, quiz et mini-projet

### 5.2. Business District

Quartier professionnel comprenant :

-   entreprises ;
-   agences ;
-   startups ;
-   espaces de coworking ;
-   bureaux ;
-   offres d'emploi ;
-   stages ;
-   missions freelance ;
-   entretiens et tests de recrutement.

Exemple d'offre :

**Développeur junior**

-   Salaire : 450 000 Ar virtuels par mois
-   Compétences demandées : JavaScript, React, Git
-   Expérience : au moins un projet pratique
-   Condition : réussir une évaluation et un entretien simulé

### 5.3. Residential District

Le joueur peut choisir un logement selon ses moyens et ses besoins.

  Logement        Loyer mensuel simulé   Confort
  ------------- ---------------------- ---------
  Chambre                    70 000 Ar       2/5
  Studio                    150 000 Ar       3/5
  Appartement               300 000 Ar       4/5
  Villa                     700 000 Ar       5/5

Un logement plus coûteux améliore éventuellement le confort, mais
augmente les dépenses récurrentes. Les prix sont des exemples
configurables, non des références de marché.

### 5.4. Finance District

Quartier consacré à l'apprentissage de la gestion financière.

Fonctionnalités :

-   compte bancaire virtuel ;
-   épargne ;
-   budget mensuel ;
-   crédit simulé ;
-   investissement simulé ;
-   assurance simulée ;
-   objectifs financiers ;
-   historique des transactions.

**Règle essentielle :** toutes les opérations de ce quartier sont
fictives et éducatives. Aucun dépôt d'argent réel ne doit être requis
pour jouer.

### 5.5. Market District

Marché virtuel permettant d'acheter des biens et services :

-   nourriture ;
-   vêtements ;
-   téléphone ;
-   ordinateur ;
-   meubles ;
-   transport ;
-   loisirs ;
-   outils professionnels ;
-   services.

Chaque achat modifie le budget et peut avoir des effets sur le confort,
les compétences ou la productivité du personnage.

### 5.6. Startup District

Quartier dédié à la création et à la gestion d'entreprises virtuelles.

Parcours de création :

``` text
IDÉE
  |
PROBLÈME À RÉSOUDRE
  |
CLIENTS ET MARCHÉ
  |
BUSINESS MODEL
  |
PROTOTYPE
  |
PREMIERS CLIENTS
  |
REVENUS
  |
CROISSANCE
```

Le joueur doit gérer :

-   les coûts ;
-   le marketing ;
-   les employés ;
-   les clients ;
-   les revenus ;
-   la réputation ;
-   la trésorerie ;
-   les risques et imprévus.

### 5.7. City Hub

Centre social de la ville.

Fonctionnalités :

-   événements ;
-   communautés ;
-   groupes ;
-   classements facultatifs ;
-   défis collectifs ;
-   rencontres ;
-   collaborations ;
-   annonces officielles de la ville.

Exemple : hackathon virtuel de 48 heures, en équipes de 3 à 5 personnes,
avec récompenses en XP et éléments cosmétiques.

------------------------------------------------------------------------

## 6. Personnage et profil utilisateur

Chaque utilisateur dispose d'un personnage représentant son parcours
dans la ville.

### 6.1. Profil du personnage

Le profil peut contenir :

-   nom public ou pseudonyme ;
-   avatar ;
-   niveau ;
-   expérience (XP) ;
-   énergie ;
-   bien-être simulé ;
-   argent virtuel ;
-   épargne virtuelle ;
-   logement ;
-   emploi ;
-   études ;
-   compétences ;
-   projets ;
-   badges ;
-   historique des accomplissements.

Exemple :

``` text
PERSONNAGE : Alex
Niveau : 17
XP : 8 450

Argent virtuel : 125 000 Ar
Épargne virtuelle : 300 000 Ar
Bien-être simulé : 78 %
Énergie : 64 %

Éducation : 72 %
Employabilité : 68 %
Finance : 51 %
Entrepreneuriat : 42 %
Social : 74 %
```

Ces indicateurs sont des mécaniques de jeu, pas des évaluations
psychologiques ou médicales.

### 6.2. Personnalisation

Prévoir progressivement :

-   choix du genre ou d'un avatar neutre ;
-   apparence ;
-   vêtements ;
-   accessoires ;
-   décoration du logement ;
-   titre public ;
-   éléments cosmétiques débloqués.

La personnalisation ne doit pas donner d'avantage injuste dans les
activités éducatives.

------------------------------------------------------------------------

## 7. Système de compétences

Le système de compétences constitue l'un des piliers du produit.

### 7.1. Catégories

**Soft skills**

-   communication ;
-   leadership ;
-   organisation ;
-   travail d'équipe ;
-   créativité ;
-   résolution de problèmes ;
-   négociation.

**Hard skills**

-   programmation ;
-   design ;
-   marketing ;
-   comptabilité ;
-   analyse de données ;
-   langues ;
-   gestion de projet.

**Life skills**

-   gestion d'un budget ;
-   cuisine ;
-   gestion du temps ;
-   recherche d'emploi ;
-   préparation d'un entretien ;
-   organisation administrative ;
-   prise de décision.

### 7.2. Acquisition et validation

Une compétence peut progresser grâce à :

-   une leçon ;
-   un exercice ;
-   un quiz ;
-   une mission ;
-   un projet ;
-   une collaboration ;
-   une évaluation pratique.

Le système doit distinguer une compétence simplement étudiée d'une
compétence démontrée par une réalisation.

------------------------------------------------------------------------

## 8. Expérience, niveaux et récompenses

### 8.1. Points d'expérience

Exemples de récompenses :

  Action                            XP
  ----------------------------- ------
  Lire une leçon                   +10
  Réussir un quiz                  +25
  Terminer une formation          +150
  Réussir un entretien simulé     +100
  Créer un projet                 +300
  Participer à un événement        +50
  Aider un autre joueur            +30

Les valeurs devront être équilibrées par des tests. Le système doit
éviter les abus, les répétitions artificielles et les récompenses
disproportionnées.

### 8.2. Niveaux

Exemple de progression :

    Niveau Titre
  -------- -----------------
         1 Nouveau citoyen
         5 Explorateur
        10 Apprenti
        20 Professionnel
        30 Entrepreneur
        50 City Builder

### 8.3. Badges

Exemples :

-   First Job ;
-   Entrepreneur ;
-   Developer ;
-   Smart Saver ;
-   Scholar ;
-   Team Player ;
-   30 Day Streak ;
-   Community Builder.

Les badges doivent correspondre à des actions ou accomplissements
clairement définis.

------------------------------------------------------------------------

## 9. Temps, énergie et bien-être

### 9.1. Temps virtuel

Le jeu peut proposer une journée organisée en périodes :

``` text
MATIN
  |
JOURNÉE
  |
SOIR
  |
NUIT
```

Certaines actions consomment du temps virtuel :

  Activité             Durée simulée
  ------------------ ---------------
  Formation                 3 heures
  Travail                   8 heures
  Sport                      1 heure
  Projet personnel          2 heures

La conversion entre temps réel et temps virtuel doit être définie dans
les paramètres du jeu. Une hypothèse initiale possible est qu'une
journée virtuelle dure 15 minutes réelles, mais ce choix devra être
testé auprès des utilisateurs.

### 9.2. Énergie

Les activités consomment de l'énergie. Le personnage peut la récupérer
en dormant ou en se reposant.

### 9.3. Bien-être

Le bien-être est un indicateur de jeu influencé par l'équilibre entre
travail, repos, loisirs et dépenses. Il ne doit jamais être présenté
comme un diagnostic de santé.

Le jeu doit éviter les mécaniques punitives excessives : un joueur qui
manque quelques jours ne doit pas perdre brutalement toute sa
progression.

------------------------------------------------------------------------

## 10. Économie virtuelle

### 10.1. Monnaie

La monnaie de simulation peut être appelée **Y-AR** ou être affichée en
**Ar virtuels**.

L'interface doit signaler clairement qu'il ne s'agit pas d'argent réel.

### 10.2. Wallet

Le portefeuille présente :

-   solde disponible ;
-   revenus ;
-   dépenses ;
-   épargne ;
-   historique ;
-   transactions en attente, si nécessaire.

Exemple :

``` text
WALLET
Solde : 250 000 Ar virtuels
Revenus du mois : +450 000 Ar
Dépenses du mois : -320 000 Ar
Épargne : 150 000 Ar
```

### 10.3. Règles économiques

Le moteur économique doit gérer :

-   revenus ;
-   dépenses récurrentes ;
-   achats ;
-   loyers ;
-   salaires ;
-   frais de formation ;
-   remboursements simulés ;
-   épargne ;
-   événements économiques.

Toutes les transactions doivent être enregistrées côté serveur avec une
trace de leur origine. Le client ne doit jamais pouvoir modifier
directement son solde ou s'attribuer des récompenses.

------------------------------------------------------------------------

## 11. Emploi et carrière

### 11.1. Offres

Chaque offre doit contenir :

-   titre ;
-   entreprise ;
-   description ;
-   salaire virtuel ;
-   type de contrat ;
-   compétences requises ;
-   expérience attendue ;
-   localisation dans la ville ;
-   date limite ;
-   étapes de recrutement.

### 11.2. Parcours de candidature

1.  Consulter l'offre.
2.  Vérifier les prérequis.
3.  Préparer son profil ou son CV virtuel.
4.  Envoyer sa candidature.
5.  Réaliser un test si nécessaire.
6.  Passer un entretien simulé.
7.  Recevoir une décision.
8.  Consulter un retour pédagogique.

### 11.3. Évolution professionnelle

Le joueur peut obtenir une promotion, changer d'entreprise, se
reconvertir ou passer au travail indépendant selon ses compétences et
ses choix.

------------------------------------------------------------------------

## 12. Entretiens simulés avec l'IA

L'IA peut jouer le rôle d'un recruteur.

Exemple :

> Recruteur : Pourquoi devrions-nous vous recruter ?

L'utilisateur rédige ou prononce une réponse. Le système fournit un
retour sur :

-   pertinence ;
-   clarté ;
-   structure ;
-   exemples concrets ;
-   adéquation avec le poste.

Le feedback doit être explicatif et encourageant. Il ne doit pas
prétendre prédire avec certitude la réussite d'un véritable entretien.

------------------------------------------------------------------------

## 13. Éducation et formations

### 13.1. Structure pédagogique

``` text
COURS
  |
EXERCICE
  |
QUIZ
  |
MISSION
  |
PROJET
  |
VALIDATION
```

### 13.2. Types de contenus

-   leçons textuelles ;
-   illustrations ;
-   vidéos ou ressources externes ;
-   exercices interactifs ;
-   quiz ;
-   études de cas ;
-   projets pratiques.

### 13.3. Certifications

Les certifications internes doivent préciser leur portée : elles
attestent de la réussite d'un parcours YOUTH CITY, mais ne doivent pas
être présentées comme des diplômes officiels ou des certifications
professionnelles reconnues sans partenariat approprié.

------------------------------------------------------------------------

## 14. Projets et entrepreneuriat

Le joueur peut créer un projet personnel ou collectif.

### 14.1. Fiche projet

-   nom ;
-   problème ciblé ;
-   description ;
-   public cible ;
-   catégorie ;
-   budget virtuel ;
-   membres ;
-   objectifs ;
-   étapes ;
-   statut ;
-   résultats.

### 14.2. Cycle de vie

``` text
IDÉE
  |
PLANIFICATION
  |
CONSTITUTION DE L'ÉQUIPE
  |
PROTOTYPE
  |
TEST
  |
LANCEMENT SIMULÉ
  |
ÉVALUATION
```

Le système peut simuler des réactions de clients, des coûts, des ventes
et des imprévus. Les résultats doivent être identifiés comme des
simulations et non comme des prévisions commerciales fiables.

------------------------------------------------------------------------

## 15. Système de décisions et conséquences

C'est l'une des mécaniques centrales de YOUTH CITY.

Le jeu présente des situations qui demandent un choix. Chaque option
entraîne des conséquences cohérentes, immédiates ou différées.

Exemple :

**Ton ordinateur tombe en panne.**

-   A. Acheter un nouvel ordinateur.
-   B. Réparer l'ancien.
-   C. Emprunter temporairement un appareil.
-   D. Utiliser un crédit simulé.

Le système doit expliquer les conséquences : coût, temps, confort,
risque, capacité à poursuivre une formation ou une mission.

Les scénarios doivent proposer plusieurs choix viables, éviter les
réponses moralisatrices et expliquer les compromis.

------------------------------------------------------------------------

## 16. Événements dynamiques

La ville doit proposer des événements adaptés à la progression du
joueur.

Exemples :

-   opportunité professionnelle ;
-   concours ;
-   hackathon ;
-   promotion ;
-   mission freelance ;
-   problème budgétaire ;
-   événement universitaire ;
-   rencontre professionnelle ;
-   nouveau projet ;
-   offre de formation ;
-   événement communautaire.

Les événements peuvent être déclenchés selon le niveau, les compétences,
le quartier, les projets ou les activités récentes du joueur.

Un système de règles doit encadrer leur fréquence afin de ne pas
submerger l'utilisateur.

------------------------------------------------------------------------

## 17. Intelligence artificielle intégrée

L'IA doit agir comme un mentor et un outil d'accompagnement, pas
seulement comme un chatbot.

### 17.1. Fonctions

-   mentor professionnel ;
-   aide pédagogique ;
-   simulation d'entretien ;
-   génération de scénarios ;
-   recommandations de missions ;
-   explication des conséquences ;
-   aide à la planification ;
-   accompagnement de projets.

### 17.2. Architecture indépendante du fournisseur

Prévoir une couche d'abstraction permettant de connecter différents
fournisseurs, par exemple OpenAI, Anthropic, Google ou des modèles
accessibles via OpenRouter.

Le changement de fournisseur ne doit pas nécessiter une réécriture de la
logique métier.

### 17.3. Garde-fous

-   L'IA ne doit pas inventer des offres réelles ou des opportunités.
-   Elle doit distinguer les faits, les hypothèses et les éléments
    fictifs du jeu.
-   Elle ne doit pas fournir de conseils financiers, médicaux ou
    juridiques personnalisés présentés comme des avis professionnels.
-   Les actions ayant un effet sur le compte ou l'économie doivent être
    validées par le backend.
-   Les échanges doivent respecter les règles de confidentialité et de
    modération.

------------------------------------------------------------------------

## 18. NOVA --- Mentor personnel

**NOVA** est le nom provisoire du mentor IA.

Exemple d'interface :

``` text
NOVA

Bonjour Alex !

Voici tes priorités du jour :

[ ] Terminer le module JavaScript
[ ] Postuler à deux offres virtuelles
[ ] Épargner 20 000 Ar virtuels
[ ] Avancer sur ton projet

Conseil :
Tu as progressé en développement.
Un projet concret pourrait maintenant t'aider
à démontrer tes compétences.
```

NOVA doit tenir compte des objectifs choisis, des compétences validées,
des activités réalisées et des préférences de l'utilisateur. Il doit
permettre à l'utilisateur de corriger ou désactiver les recommandations.

------------------------------------------------------------------------

## 19. Fonctionnalités sociales

Les utilisateurs peuvent :

-   ajouter des amis ;
-   créer des équipes ;
-   rejoindre des groupes ;
-   participer à des événements ;
-   collaborer sur des projets ;
-   partager des accomplissements ;
-   échanger dans des espaces modérés.

Le social doit soutenir l'apprentissage et la collaboration, et non
transformer YOUTH CITY en réseau social généraliste.

### 19.1. Guildes et communautés

Exemples :

-   Developers ;
-   Designers ;
-   Entrepreneurs ;
-   Business ;
-   Students ;
-   Environment ;
-   AI Builders.

Chaque communauté peut organiser des défis, ateliers et projets
collectifs.

### 19.2. Protection des utilisateurs

Prévoir des paramètres de confidentialité, des contrôles de visibilité,
le blocage d'utilisateurs, le signalement et une modération adaptée à
l'âge. Les interactions entre mineurs et adultes doivent faire l'objet
de règles spécifiques et de protections renforcées.

------------------------------------------------------------------------

## 20. Challenges et compétitions

### 20.1. Défis individuels

Exemples :

-   créer son premier portfolio en 7 jours ;
-   apprendre les bases d'Excel ;
-   préparer un CV ;
-   établir un budget mensuel ;
-   terminer un parcours de formation.

### 20.2. Défis collectifs

Exemples :

-   construire une startup virtuelle en équipe ;
-   résoudre un problème de quartier ;
-   participer à un hackathon ;
-   créer une campagne de sensibilisation.

### 20.3. Récompenses

Les récompenses peuvent inclure XP, badges, titres, éléments cosmétiques
et accès à de nouveaux scénarios. Les récompenses ne doivent pas
encourager des comportements dangereux ou une compétition malsaine.

------------------------------------------------------------------------

## 21. Classements

Les classements doivent être facultatifs et proposer plusieurs
catégories :

-   compétences ;
-   projets ;
-   challenges ;
-   contribution communautaire.

Éviter de faire du classement global le cœur du produit. Prévoir des
périodes de classement, des règles anti-triche et la possibilité de
masquer son profil.

------------------------------------------------------------------------

## 22. Portfolio et Career Passport

### 22.1. Portfolio

Chaque joueur dispose d'un portfolio généré à partir de ses réalisations
:

-   formations terminées ;
-   projets ;
-   compétences démontrées ;
-   challenges ;
-   contributions ;
-   certifications internes.

Le joueur choisit ce qu'il rend public.

### 22.2. Career Passport

*Précisions v1.1 : le passeport n'est construit que de faits enregistrés, sa publication est
facultative et révocable, et la vérification publique se fait par code aléatoire (voir §48.3).*

Le Career Passport est un profil partageable qui présente les
compétences et preuves obtenues dans YOUTH CITY.

Exemple :

``` text
YOUTH CITY PASSPORT

Compétences validées : 8
Projets : 12
Challenges : 34
Parcours terminés : 5
Projets collectifs : 8
```

Les indicateurs doivent être vérifiables dans la plateforme et ne pas
être assimilés automatiquement à des qualifications officielles.

------------------------------------------------------------------------

## 23. Dashboard principal

Le tableau de bord doit être lisible, utile et orienté vers l'action.

Exemple :

``` text
YOUTH CITY

Bonjour Alex !

OBJECTIF
Devenir développeur
Progression : 76 %

RESSOURCES
Argent virtuel : 425 000 Ar
Énergie : 72 %
Bien-être simulé : 81 %

AUJOURD'HUI
[✓] Formation
[ ] Mission professionnelle
[ ] Challenge

NOVA
« Voici ce que je te recommande aujourd'hui… »
```

Le dashboard doit présenter les informations essentielles sans
surcharger l'utilisateur.

------------------------------------------------------------------------

## 24. Carte interactive

La carte constitue le point d'entrée visuel de la ville.

Exemple de disposition :

``` text
                  CAMPUS
                     |
                     |
RESIDENTIAL --- CITY CENTER --- BUSINESS
                     |
                     |
                  FINANCE
                     |
                  STARTUP
                     |
                   MARKET
```

### 24.1. Interactions

-   cliquer sur un quartier ;
-   afficher sa description ;
-   consulter les bâtiments disponibles ;
-   voir les activités possibles ;
-   afficher les événements ;
-   accéder aux missions du quartier.

### 24.2. Approche technique

Pour le MVP, privilégier une carte 2D interactive, légère et responsive.
Une ville 3D complexe n'est pas nécessaire au lancement.

------------------------------------------------------------------------

## 25. Application web et expérience mobile

Le produit doit être conçu en **responsive-first**.

Priorités :

1.  smartphone ;
2.  tablette ;
3.  ordinateur.

Une PWA pourra être envisagée pour proposer une installation sur l'écran
d'accueil et certaines fonctions hors ligne. Une application native
pourra être étudiée ultérieurement selon les besoins réels. *Décision v1.1 : la PWA est
reportée après le MVP (voir §48.5).*

### Navigation principale

-   Ville ;
-   Missions ;
-   Apprendre ;
-   Travail ;
-   Projets ;
-   Finance ;
-   Social ;
-   Profil ;
-   NOVA.

Sur mobile, utiliser une navigation compacte, avec les accès les plus
importants toujours visibles.

------------------------------------------------------------------------

## 26. Direction artistique et UX/UI

### 26.1. Identité visuelle

Direction recommandée :

**moderne, jeune, légèrement futuriste, chaleureuse et accessible.**

L'interface doit évoquer un mélange de :

-   jeu de simulation ;
-   application de gestion ;
-   plateforme éducative ;
-   réseau professionnel.

### 26.2. Principes visuels

-   cartes claires ;
-   bâtiments stylisés ;
-   illustrations cohérentes ;
-   animations légères ;
-   micro-interactions ;
-   avatar personnalisable ;
-   hiérarchie typographique nette ;
-   couleurs accessibles ;
-   contrastes suffisants ;
-   états de chargement, erreur et succès soignés.

Éviter une interface trop enfantine ou trop proche d'un jeu mobile
rempli de fenêtres et de récompenses.

### 26.3. Accessibilité

Prévoir :

-   navigation clavier ;
-   textes lisibles ;
-   contrastes conformes aux bonnes pratiques WCAG ;
-   libellés accessibles ;
-   alternatives textuelles aux images ;
-   réduction des animations ;
-   interfaces utilisables sur des écrans modestes.

------------------------------------------------------------------------

## 27. Architecture technique recommandée

### 27.1. Frontend

**React + TypeScript + Vite**

Technologies et outils possibles :

-   React Router pour la navigation ;
-   TanStack Query pour les données serveur ;
-   Zustand pour l'état client partagé ;
-   Tailwind CSS pour les styles ;
-   bibliothèque de composants accessible et réutilisable ;
-   Framer Motion pour les animations, avec usage mesuré.

### 27.2. Backend

**Django + Django REST Framework**

Justification :

YOUTH CITY comporte de nombreuses règles métier : utilisateurs,
personnages, économie, compétences, missions, progression, événements,
projets et interactions sociales. Django fournit une base structurée
pour gérer ces domaines.

### 27.3. Base de données

**PostgreSQL**

Elle stockera les comptes, personnages, compétences, transactions
virtuelles, activités, projets, événements et données de progression.

### 27.4. Cache et tâches asynchrones

**Redis** pourra être utilisé pour le cache, les files de tâches et
certaines fonctions temps réel. Un outil de tâches asynchrones pourra
être ajouté lorsque les besoins seront confirmés.

### 27.5. IA

Créer une couche de service indépendante des fournisseurs afin de
faciliter le changement de modèle et la gestion des coûts.

------------------------------------------------------------------------

## 28. Organisation indicative du code

``` text
frontend/
├── public/
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── features/
│   │   ├── city/
│   │   ├── character/
│   │   ├── education/
│   │   ├── career/
│   │   ├── finance/
│   │   ├── business/
│   │   ├── projects/
│   │   ├── social/
│   │   ├── challenges/
│   │   └── ai/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
├── tests/
└── README.md

backend/
├── config/
├── apps/
│   ├── users/
│   ├── city/
│   ├── characters/
│   ├── skills/
│   ├── education/
│   ├── careers/
│   ├── finance/
│   ├── businesses/
│   ├── projects/
│   ├── social/
│   ├── challenges/
│   ├── events/
│   ├── ai/
│   └── notifications/
├── tests/
├── manage.py
└── README.md
```

Cette structure est indicative. Elle devra être adaptée à la taille
réelle du MVP, sans multiplier prématurément les applications ou couches
abstraites.

------------------------------------------------------------------------

## 29. Modèle de données initial

Les entités principales envisagées sont les suivantes.

### User

-   id ;
-   username ;
-   email ;
-   password_hash ;
-   date de création ;
-   statut ;
-   paramètres de confidentialité.

### Character

-   id ;
-   user_id ;
-   nom public ;
-   niveau ;
-   XP ;
-   énergie ;
-   bien-être simulé ;
-   argent virtuel ;
-   date de création.

### Skill

-   id ;
-   nom ;
-   catégorie ;
-   description ;
-   règles de validation.

### CharacterSkill

-   character_id ;
-   skill_id ;
-   niveau ;
-   expérience ;
-   statut de validation ;
-   preuves associées.

### Property

-   id ;
-   nom ;
-   type ;
-   prix ;
-   loyer ;
-   confort ;
-   disponibilité.

### Job

-   id ;
-   titre ;
-   entreprise ;
-   salaire virtuel ;
-   description ;
-   prérequis ;
-   statut.

### Project

-   id ;
-   owner_id ;
-   nom ;
-   description ;
-   budget virtuel ;
-   statut ;
-   dates.

### Event

-   id ;
-   titre ;
-   description ;
-   type ;
-   difficulté ;
-   récompense ;
-   conditions de déclenchement ;
-   période de disponibilité.

### Transaction

Une entité de transaction est indispensable pour l'économie :

-   id ;
-   character_id ;
-   type ;
-   montant ;
-   devise virtuelle ;
-   motif ;
-   référence à l'activité ;
-   date ;
-   solde avant ;
-   solde après.

Les opérations financières virtuelles doivent être atomiques, contrôlées
côté serveur et auditables.

------------------------------------------------------------------------

## 30. API et logique métier

Le backend devra exposer des API documentées, versionnées et protégées.

Domaines d'API indicatifs :

-   authentification et comptes ;
-   personnages et profils ;
-   carte et quartiers ;
-   compétences ;
-   formations et évaluations ;
-   emplois et candidatures ;
-   portefeuille et transactions virtuelles ;
-   logements et inventaire ;
-   projets et équipes ;
-   événements et challenges ;
-   communautés ;
-   mentor IA ;
-   notifications.

Les règles sensibles --- calcul des soldes, attribution d'XP, validation
de compétences, conditions d'accès et conséquences des choix --- doivent
être exécutées côté serveur.

------------------------------------------------------------------------

## 31. Sécurité et confidentialité

Prévoir :

-   authentification sécurisée ;
-   hachage robuste des mots de passe ;
-   gestion des sessions ou jetons ;
-   protection CSRF selon le mode d'authentification ;
-   limitation du débit des requêtes ;
-   validation stricte côté serveur ;
-   permissions par rôle ;
-   journalisation des actions sensibles ;
-   protection contre les abus ;
-   sauvegardes ;
-   gestion des secrets par variables d'environnement ;
-   politique de conservation et suppression des données.

### 31.1. Protection des mineurs

Comme le public peut inclure des mineurs :

-   collecter le minimum de données personnelles ;
-   définir des règles d'âge et de consentement adaptées aux lois
    applicables ;
-   limiter les messages privés et les contacts non sollicités ;
-   proposer blocage et signalement ;
-   modérer les contenus et comportements ;
-   éviter l'exposition publique de données personnelles ;
-   prévoir des paramètres de confidentialité adaptés ;
-   ne pas utiliser de mécaniques de pression ou de dépenses réelles.

Une revue juridique et de protection des données devra être réalisée
avant l'ouverture au public.

------------------------------------------------------------------------

## 32. Modération et sécurité communautaire

Le parcours de modération doit comprendre :

``` text
SIGNALEMENT
    |
EXAMEN
    |
DÉCISION
    |
AVERTISSEMENT OU SANCTION
    |
SUIVI ET POSSIBILITÉ DE RECOURS
```

Les règles doivent couvrir :

-   spam ;
-   harcèlement ;
-   menaces ;
-   contenus sexuels inappropriés ;
-   fraude ;
-   usurpation d'identité ;
-   comportements abusifs ;
-   partage de données personnelles.

Prévoir une interface d'administration des signalements et un historique
des décisions.

------------------------------------------------------------------------

## 33. Monétisation

Le gameplay essentiel doit rester accessible gratuitement.

### 33.1. Offre gratuite

-   accès à la ville de base ;
-   création de personnage ;
-   progression ;
-   formations de base ;
-   missions ;
-   emplois virtuels ;
-   challenges ;
-   portfolio de base.

### 33.2. Offre Premium éventuelle

-   mentor IA avec limites plus élevées ;
-   simulations supplémentaires ;
-   analyses détaillées ;
-   personnalisation cosmétique ;
-   outils avancés de suivi.

Les fonctionnalités éducatives fondamentales ne doivent pas être
artificiellement bloquées derrière un abonnement.

### 33.3. Offre B2B

Des établissements scolaires, universités ou organisations pourraient
disposer d'espaces privés :

**YOUTH CITY CAMPUS --- Université X**

Un enseignant ou animateur pourrait :

-   créer une classe ;
-   inviter des participants ;
-   assigner des missions ;
-   suivre les résultats pédagogiques ;
-   organiser des challenges ;
-   consulter des statistiques agrégées.

Les données individuelles des jeunes doivent rester protégées.

------------------------------------------------------------------------

## 34. Back-office d'administration

Un espace réservé aux administrateurs et modérateurs doit permettre de
gérer :

-   utilisateurs ;
-   rôles et permissions ;
-   compétences ;
-   formations ;
-   emplois ;
-   entreprises virtuelles ;
-   bâtiments et quartiers ;
-   événements ;
-   challenges ;
-   récompenses ;
-   paramètres économiques ;
-   contenus pédagogiques ;
-   signalements ;
-   statistiques ;
-   paramètres IA.

Les actions administratives sensibles doivent être journalisées.

------------------------------------------------------------------------

## 35. Analytics et indicateurs de réussite

Mesurer notamment :

-   utilisateurs actifs ;
-   rétention ;
-   parcours commencés et terminés ;
-   formations terminées ;
-   compétences démontrées ;
-   projets créés ;
-   challenges réussis ;
-   collaborations réalisées ;
-   progression des objectifs ;
-   satisfaction utilisateur.

Ne pas optimiser uniquement le temps passé ou le nombre de connexions.
La réussite du produit doit être évaluée à travers les apprentissages et
réalisations.

------------------------------------------------------------------------

## 36. MVP --- Première version

Il est fortement déconseillé de développer toute la ville dès le départ.

Le MVP doit valider la boucle principale : apprendre, développer une
compétence, obtenir une opportunité, gagner un revenu virtuel, gérer ses
dépenses et observer les conséquences.

### 36.1. Fonctionnalités incluses

1.  Inscription, connexion et profil.
2.  Création du personnage.
3.  Dashboard principal.
4.  Carte 2D avec quelques quartiers.
5.  Campus et formations simples.
6.  Système de compétences.
7.  Missions et objectifs.
8.  Quelques offres d'emploi virtuelles.
9.  Candidature et entretien simplifiés.
10. Salaire virtuel.
11. Budget et dépenses de base.
12. Quelques événements et décisions.
13. XP, niveaux et badges.
14. Historique des actions.

### 36.2. Parcours MVP

``` text
AUTHENTIFICATION
       |
CRÉATION DU PERSONNAGE
       |
EXPLORATION DE LA VILLE
       |
FORMATION
       |
COMPÉTENCE
       |
CANDIDATURE
       |
EMPLOI ET SALAIRE VIRTUEL
       |
BUDGET ET DÉPENSES
       |
DÉCISION
       |
CONSÉQUENCE
       |
PROGRESSION
```

### 36.3. Critères d'acceptation du MVP

Le MVP pourra être considéré comme fonctionnel lorsque :

-   un utilisateur peut créer et retrouver son compte ;
-   son personnage est sauvegardé ;
-   la carte permet d'accéder aux quartiers disponibles ;
-   une formation peut être commencée et terminée ;
-   les compétences progressent selon des règles définies ;
-   les missions et récompenses sont validées côté serveur ;
-   les candidatures suivent un processus cohérent ;
-   le salaire virtuel est crédité correctement ;
-   les dépenses sont débitées correctement ;
-   le solde ne peut pas être modifié depuis le navigateur ;
-   l'historique des transactions est consultable ;
-   l'interface fonctionne sur mobile et desktop ;
-   les erreurs et états de chargement sont gérés ;
-   les tests critiques passent.

------------------------------------------------------------------------

## 37. Version 2

Après validation du MVP, ajouter :

-   mentor IA NOVA ;
-   projets personnels ;
-   entrepreneuriat ;
-   portfolio ;
-   challenges avancés ;
-   événements dynamiques ;
-   fonctionnalités sociales ;
-   communautés ;
-   collaboration en équipe.

------------------------------------------------------------------------

## 38. Version 3

Évolutions possibles :

-   guildes ;
-   compétitions ;
-   économie virtuelle avancée ;
-   Career Passport ;
-   espaces pour établissements partenaires ;
-   PWA ;
-   notifications avancées ;
-   application mobile dédiée ;
-   davantage de quartiers et de scénarios.

------------------------------------------------------------------------

## 39. Exemple de journée de jeu

Un joueur se connecte et découvre son état :

-   argent virtuel : 500 000 Ar ;
-   énergie : 80 % ;
-   objectif : devenir développeur.

**08 h --- Formation**

Le joueur suit un module JavaScript de deux heures virtuelles et gagne
50 XP.

**12 h --- Opportunité**

Une entreprise virtuelle recherche un développeur junior. Le joueur ne
possède pas encore toutes les compétences demandées.

**15 h --- Mission**

Il reçoit une mission de création de landing page, avec une récompense
simulée de 100 000 Ar.

**18 h --- Réalisation**

Il termine la mission, reçoit la récompense et ajoute le travail à son
portfolio.

**20 h --- Conseil de NOVA**

Le mentor lui recommande de documenter le projet et de renforcer une
compétence précise.

Résumé de la journée :

``` text
XP : +250
Argent virtuel : +100 000 Ar
Portfolio : +1 projet
JavaScript : progression +4 %
```

Les horaires et récompenses sont des exemples de scénario.

------------------------------------------------------------------------

## 40. Innovations différenciantes

### 40.1. Life Simulation Engine

Moteur de simulation qui fait évoluer la ville selon les décisions, les
ressources, les compétences et les événements.

### 40.2. AI Life Mentor

Mentor qui comprend le parcours de l'utilisateur et l'aide à définir des
prochaines étapes réalistes.

### 40.3. Skill Passport

Profil de compétences basé sur des preuves concrètes et des
réalisations.

### 40.4. Dynamic Life Events

Événements adaptés au parcours, plutôt qu'une succession identique de
scénarios pour tous.

### 40.5. Parcours multiples

Exemples :

``` text
PARCOURS A
Études
  |
Développeur
  |
Freelance
  |
Startup
  |
Entrepreneur
```

``` text
PARCOURS B
Université
  |
Marketing
  |
Entreprise
  |
Manager
  |
Consultant
```

Aucun parcours ne doit être présenté comme intrinsèquement supérieur. Le
jeu doit montrer les avantages, limites et compromis de chaque choix.

------------------------------------------------------------------------

## 41. Navigation

Navigation principale proposée :

-   Ville ;
-   Missions ;
-   Apprendre ;
-   Travail ;
-   Projets ;
-   Finance ;
-   Social ;
-   Profil ;
-   NOVA.

La navigation mobile doit rester compacte et donner la priorité à la
ville, aux missions, au travail, au mentor et au profil.

------------------------------------------------------------------------

## 42. Principes UX essentiels

L'utilisateur ne doit jamais se demander ce qu'il peut faire ensuite.

Prévoir une zone **Prochaine action** présentant une recommandation
concrète :

> Termine le module JavaScript. Récompense : +100 XP.

Cette recommandation doit rester facultative. L'utilisateur doit pouvoir
explorer librement d'autres activités.

Autres exigences :

-   onboarding progressif ;
-   explication des règles au moment utile ;
-   tutoriel court ;
-   sauvegarde fiable ;
-   retours visuels après chaque action ;
-   messages d'erreur compréhensibles ;
-   possibilité de reprendre une activité ;
-   paramètres de notifications ;
-   réduction des animations ;
-   absence de pénalité excessive en cas d'inactivité.

------------------------------------------------------------------------

## 43. Tests et qualité

Prévoir plusieurs niveaux de tests (les exigences détaillées de qualité figurent au §49) :

### Tests unitaires

-   calcul d'XP ;
-   progression des compétences ;
-   calcul des salaires ;
-   transactions virtuelles ;
-   conditions d'accès ;
-   déclenchement d'événements.

### Tests d'intégration

-   inscription et connexion ;
-   formation et validation ;
-   candidature et recrutement ;
-   crédit de salaire ;
-   achat et débit ;
-   collaboration et récompenses.

### Tests end-to-end

-   parcours complet d'un nouvel utilisateur ;
-   parcours étudiant ;
-   parcours recherche d'emploi ;
-   parcours entrepreneur ;
-   expérience mobile.

### Tests non fonctionnels

-   performance ;
-   sécurité ;
-   accessibilité ;
-   compatibilité navigateurs ;
-   comportement sur réseau lent ;
-   sauvegarde et restauration.

------------------------------------------------------------------------

## 44. Déploiement et exploitation

L'architecture devra prévoir (les exigences d'exploitation détaillées figurent au §49.9) :

-   environnements développement, test et production ;
-   variables d'environnement ;
-   migrations de base de données ;
-   sauvegardes automatiques ;
-   logs applicatifs ;
-   surveillance des erreurs ;
-   pipeline CI/CD ;
-   gestion des secrets ;
-   documentation de déploiement ;
-   stratégie de restauration.

Le frontend et le backend peuvent être déployés séparément, à condition
de gérer correctement les URL d'API, CORS, cookies ou jetons, les
environnements et les versions.

------------------------------------------------------------------------

## 45. Indicateurs de réussite du projet

Le succès doit être évalué à plusieurs niveaux.

**Engagement utile**

-   utilisateurs qui reviennent ;
-   missions terminées ;
-   participation aux événements.

**Apprentissage**

-   compétences démontrées ;
-   formations terminées ;
-   progression aux évaluations.

**Création**

-   projets réalisés ;
-   portfolios complétés ;
-   collaborations terminées.

**Impact**

-   objectifs personnels atteints dans le jeu ;
-   amélioration des connaissances mesurées ;
-   satisfaction des utilisateurs et partenaires.

------------------------------------------------------------------------

## 46. Vision à long terme

À terme, YOUTH CITY pourrait devenir un environnement de simulation
éducative à grande échelle : un monde interactif dans lequel les jeunes
peuvent expérimenter des situations de la vie adulte, apprendre à gérer
leurs ressources, développer leurs compétences et construire des
projets.

Il n'est pas nécessaire de créer un métavers 3D coûteux. Une expérience
2D riche, réactive, accessible et bien scénarisée peut offrir une valeur
pédagogique supérieure à un monde visuellement complexe mais pauvre en
activités.

La boucle fondamentale du produit est :

``` text
OBJECTIF
   |
APPRENDRE
   |
DÉVELOPPER UNE COMPÉTENCE
   |
SAISIR UNE OPPORTUNITÉ
   |
PRENDRE UNE DÉCISION
   |
OBSERVER LES CONSÉQUENCES
   |
PROGRESSER
   |
NOUVEL OBJECTIF
```

------------------------------------------------------------------------

## 47. Résumé exécutif

YOUTH CITY est une plateforme de simulation interactive de la vie adulte
destinée principalement aux jeunes de 15 à 30 ans.

Elle réunit :

  Pilier    Fonction
  --------- --------------------------------------------------
  Learn     Apprendre et développer ses compétences
  Work      Découvrir les métiers et les opportunités
  Build     Construire des projets et simuler une entreprise
  Money     Apprendre à gérer un budget virtuel
  Network   Collaborer et participer à une communauté

Le tout est soutenu par une ville interactive, un moteur de simulation,
un système de progression, des événements et un mentor IA.

### Positionnement final

> **YOUTH CITY est une simulation interactive de la vie adulte
> permettant aux jeunes d'apprendre, d'expérimenter et de construire
> leur avenir dans un monde virtuel.**

### Règle fondamentale de conception

Chaque fonctionnalité doit remplir au moins l'un des rôles suivants :

1.  apprendre quelque chose ;
2.  permettre de construire quelque chose ;
3.  créer une décision intéressante ;
4.  faire progresser le joueur.

Cette règle doit guider les choix fonctionnels, techniques et graphiques
afin d'éviter de créer une plateforme volumineuse, mais dépourvue
d'objectif pédagogique clair.

------------------------------------------------------------------------

## 48. Décisions de conception et état d'avancement (v1.1)

Cette section consigne les décisions prises lors de la mise en œuvre du MVP et précise la lecture
des sections précédentes. En cas de contradiction, le §48 prévaut.

### 48.1. Règles de jeu appliquées côté serveur

  Sujet                    Décision
  ------------------------ ------------------------------------------------------------------------------------------
  Formations (§7, §13)     Inscription payante (frais débités et tracés). Les modules se valident dans l'ordre, par quiz. XP, compétences et certification ne sont versées qu'une fois, à la fin du parcours.
  Embauche (§11)           Prérequis de compétences et entretien simulé réussi obligatoires. L'XP d'embauche est versée une fois par offre.
  Temps et énergie (§9)    L'énergie ne se récupère qu'au passage à la journée suivante. Dormir fait passer la nuit (et le loyer éventuel).
  Revenus (§10)            Un shift salarié par jour de jeu. Les revenus d'une startup s'encaissent une fois par période de 30 jours de jeu.
  Décisions (§15)          Seul le dilemme déclenché par le serveur peut être résolu, une seule fois.
  Personnage (§6)          Création en une fois. « Nouvelle partie » remet tout à zéro, y compris les publications du passeport.
  Transactions (§29)       Chaque transaction enregistre le solde courant avant et après l'opération.
  Guildes (§19.1)          Le bonus de bienvenue est versé une seule fois par citoyen.
  Badges (§8.3)            Huit badges aux règles explicites, attribués par le serveur. « 30 Days In » correspond au jour de jeu 30, non à une série de connexions.
  Catalogues publics       Les bonnes réponses des quiz et le barème des entretiens ne sont jamais envoyés au client.

### 48.2. Protection des mineurs et confidentialité (§19.2, §31.1)

-   **Données collectées :** l'année de naissance uniquement, l'acceptation des conditions
    d'utilisation et, pour les moins de 18 ans, la déclaration d'accord du représentant légal.
-   **Âge minimal d'inscription :** 13 ans (le public cible reste 15-30 ans). Les seuils (13 et 18 ans)
    sont des choix de produit soumis à la revue juridique exigée au §31.1.
-   **Âge inconnu :** traité comme mineur. Les comptes antérieurs à cette règle déclarent leur année
    de naissance une seule fois ; seul un administrateur peut la corriger ensuite.
-   **Cloisonnement :** un mineur et un adulte ne s'écrivent pas directement et n'apparaissent pas dans
    l'annuaire ou les classements l'un de l'autre.
-   **Visibilité :** les profils de mineurs sont masqués par défaut ; chaque joueur peut modifier sa
    présence dans l'annuaire et les classements. Un citoyen masqué ne peut pas être contacté en devinant
    son identifiant.
-   **Blocage et signalement :** blocage bidirectionnel (plus de messages, plus de visibilité) et
    signalement depuis la messagerie.
-   **Citoyens simulés :** les pairs fictifs du jeu sont signalés comme tels, leurs réponses sont
    automatiques, et ils sont exclus des classements.
-   **Modération (§32) :** les décisions sont validées, tracées (auteur, date) et appliquées :
    suspension de compte (sauf comptes du personnel), quarantaine d'un message. Une sanction peut être
    levée par une nouvelle décision.

### 48.3. Career Passport (§22)

-   Il ne contient que des faits enregistrés dans la plateforme. Aucune donnée de remplissage n'est
    ajoutée : un passeport vide reste vide.
-   Les certifications sont internes à YOUTH CITY et ne sont pas des diplômes (§13.3).
-   La publication est facultative et choisie section par section (compétences, certifications,
    projets, badges, statistiques). Elle génère un code aléatoire que le joueur peut révoquer ; retirer la
    publication invalide immédiatement les liens déjà partagés.
-   La vérification publique se fait par ce code uniquement, jamais par un identifiant citoyen, avec une
    limite de débit. Seules les sections autorisées sont renvoyées.
-   Le contenu est signé par le serveur (HMAC-SHA256) : cela garantit son origine, pas une qualification
    officielle.

### 48.4. Mentor IA NOVA (§17, §18)

-   Une interface de fournisseur unique ; la logique métier ne dépend d'aucun fournisseur. Fournisseurs
    disponibles : règles locales (par défaut, gratuites) et Claude via le SDK officiel. Tout autre
    fournisseur s'ajoute derrière la même interface.
-   Le choix se fait par configuration (`NOVA_AI_PROVIDER`, `NOVA_AI_MODEL`). Sans clé API ni paquet
    optionnel, NOVA fonctionne avec les règles locales.
-   L'IA ne produit que du texte : elle ne peut modifier ni solde, ni XP, ni progression. Le message du
    joueur est transmis comme donnée, jamais mêlé au prompt système. En cas d'erreur, de refus ou de
    réponse vide, NOVA retombe sur les règles locales.
-   Limites par compte : 20 messages par minute et 200 par jour, pour borner le coût.
-   Les réponses générées par IA sont signalées comme telles à l'utilisateur.

### 48.5. Périmètre reporté et points ouverts

  Sujet                          État
  ------------------------------ -------------------------------------------------------------------------------
  PWA (§25)                      Reportée après le MVP : le jeu fait autorité côté serveur, un mode hors ligne exigerait un modèle de synchronisation.
  Entretien par IA (§12)         Reste un QCM ; le texte libre évalué par IA est prévu en V2.
  Désactiver NOVA (§18)          Non implémenté (V2).
  Amis et équipes (§19)          Non implémentés ; seuls les groupes (guildes) et la messagerie existent.
  Recours de modération (§32)    Un compte suspendu ne peut pas s'authentifier : le recours passe hors application et reste à outiller.
  Revue juridique (§31.1)        À réaliser avant l'ouverture au public (seuils d'âge, consentement, conservation des données).
  Infrastructure (§27, §44)      PostgreSQL, Redis et pipeline CI/CD ne sont pas encore en place (voir §49.5 et §49.9).

------------------------------------------------------------------------

## 49. Exigences de maintenabilité et de qualité (v1.2)

Ces exigences s'appliquent à tout nouveau code. Pour l'existant, la colonne « État » indique l'écart à
résorber ; elle alimente le plan de travail. Chaque exigence porte un identifiant stable (famille et
numéro) à citer dans le code, les tests, les décisions d'architecture et les revues, à la place des
numéros de section qui changent d'une version du cahier à l'autre.

États : **Conforme** · **Partiel** · **Non conforme**. Situation relevée en novembre 2026.

### 49.1. Source de vérité des règles (ARC)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| ARC-01 | Toute règle de jeu (gains, coûts, conditions d'accès, calculs d'XP, de salaire, de loyer, validations) est exécutée côté serveur et n'est écrite qu'une seule fois. Le frontend n'affiche que ce que le serveur renvoie. | Aucun calcul de solde, d'XP ou de gain dans le code du frontend. | Partiel |
| ARC-02 | Le mode invité est une visite en lecture seule : carte, catalogues publics, présentation. Toute action de jeu exige un compte. Aucune simulation locale. | Un invité ne peut modifier aucun état ; aucun store ne contient de logique de jeu. | Non conforme |
| ARC-03 | Aucune donnée de jeu en dur dans le frontend (catalogues, prix, barèmes, dilemmes) : elles viennent de l'API. | Le fichier de données statiques est supprimé ; seuls des jeux de données de test subsistent. | Non conforme |
| ARC-04 | Toute modification d'argent, d'XP, de compétence ou de progression passe par une fonction de domaine unique, dans une transaction qui verrouille le personnage. | Aucune écriture directe de ces champs dans les vues ; contrôle automatique en CI. | Partiel |

### 49.2. Contrat d'API (API)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| API-01 | Le schéma OpenAPI généré fait foi. Les types du frontend en sont générés. | La CI régénère les types et échoue s'ils diffèrent de ceux du dépôt. | Non conforme |
| API-02 | Un changement incompatible crée une nouvelle version (`/api/v2/`). Un endpoint retiré est d'abord déprécié pendant une version. | Journal des changements d'API ; en-tête de dépréciation. | Partiel |
| API-03 | Un seul format d'erreur : `{ "code": "...", "message": "...", "fields": { } }`, avec des codes stables. | Toutes les réponses 4xx respectent ce schéma (test automatique). | Non conforme |
| API-04 | Les listes sont bornées (pagination ou limite documentée). | Test sur chaque endpoint de liste. | Partiel |

### 49.3. Organisation du code (ORG)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| ORG-01 | Backend : une application par domaine (comptes, personnage, campus, carrière, finance, marché, startup, social, passeport, mentor IA, modération), conformément au §28. | Chaque application a ses modèles, services, vues, tests et README. | Non conforme |
| ORG-02 | Les règles métier vivent dans des fonctions de service testables sans HTTP. Les vues valident, appellent un service et sérialisent. | Les services sont testés sans client HTTP. | Non conforme |
| ORG-03 | Frontend : un dossier par domaine, un store par domaine, et les données serveur gérées par une couche de requêtes (TanStack Query, déjà prévue au §27.1). | Aucun store de plus de 300 lignes. | Non conforme |
| ORG-04 | Plafonds de taille au-delà desquels la revue exige une justification ou un découpage : fichier 400 lignes, fonction 50 lignes, composant React 300 lignes. | Contrôle automatique en CI (avertissement). | Non conforme |
| ORG-05 | Identifiants de code en anglais ; commentaires, messages et documentation en français. | Revue de code. | Partiel |

### 49.4. Équilibrage et économie (BAL)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| BAL-01 | Les paramètres d'équilibrage (gains d'XP, jours ouvrés par mois, taux d'intérêt, seuils de réussite, délais, prix de référence, plafonds) sont dans une configuration versionnée, modifiable sans toucher aux vues, avec un journal des changements (§3.3, §8.1). | Aucune constante d'équilibrage en dur dans les vues. | Non conforme |
| BAL-02 | Invariant : aucune action répétable ne rapporte sans consommer une ressource qui ne se régénère pas gratuitement (temps, énergie, argent). | Test automatique pour chaque action répétable. | Partiel |
| BAL-03 | Des simulations de parcours types (étudiant, salarié, entrepreneur) sur 90 jours de jeu vérifient que le solde final reste dans des bornes documentées. | Script de simulation exécuté en CI. | Non conforme |
| BAL-04 | La masse monétaire virtuelle (totale et par joueur) est mesurée et déclenche une alerte en cas de croissance anormale. | Indicateur au back-office et seuil d'alerte. | Partiel |

### 49.5. Qualité et intégration continue (QUA)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| QUA-01 | Dépôt git, branche principale protégée, toute modification passe par une revue, messages de commit conventionnels. | Aucun commit direct sur la branche principale. | Non conforme |
| QUA-02 | Intégration continue bloquante : lint Python, tests backend avec couverture globale d'au moins 80 % (90 % pour les services et l'économie), `makemigrations --check`, `check --deploy`, typecheck et lint frontend, tests frontend, build, `pip-audit`, `npm audit` (niveau élevé). | Aucune fusion si un contrôle échoue. | Non conforme |
| QUA-03 | Contrôles locaux avant commit (lint, typecheck rapide). | Hook de pré-commit installé par un script. | Non conforme |
| QUA-04 | Une migration appliquée ne se modifie jamais. Un champ ne se supprime qu'en deux versions. Les migrations de données sont réversibles quand c'est possible. | Revue et contrôle des migrations en CI. | Conforme |
| QUA-05 | Le seed est idempotent et n'écrase jamais des données de joueurs. Les données de démonstration n'existent que sur demande explicite (`--demo-citizen`). | Test du seed exécuté deux fois. | Conforme |

### 49.6. Tests (TST)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| TST-01 | Pyramide de tests : unitaires sur les services, intégration sur l'API, quelques tests de bout en bout. | Rapport de tests par niveau. | Partiel |
| TST-02 | Tests rangés par domaine (un module par application) et nommés par comportement. | Aucun fichier de test de plus de 400 lignes. | Partiel |
| TST-03 | Frontend : tests Vitest et Testing Library pour les stores et composants critiques (inscription, inscription à une formation, publication du passeport). | Couverture des parcours critiques. | Non conforme |
| TST-04 | Tests de bout en bout (Playwright) du parcours MVP du §36.2, sur ordinateur et sur mobile. | Exécutés en CI avant chaque version. | Non conforme |
| TST-05 | Toute faille ou exploit corrigé laisse un test de non-régression. | Revue de chaque correction. | Conforme |
| TST-06 | Contrôle d'accessibilité automatique (axe) des vues principales ; contrastes, clavier et réduction des animations (§26.3). | Zéro erreur bloquante. | Non conforme |

### 49.7. Traçabilité et documentation (DOC)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| DOC-01 | Chaque exigence du cahier a un identifiant stable. Le code, les tests et les décisions citent ces identifiants, jamais un numéro de section. | Aucune référence « §N » dans le code. | Non conforme |
| DOC-02 | Une matrice dans `docs/` relie chaque exigence du MVP à son statut (fait, partiel, absent), son code et son test. Elle est mise à jour dans la même modification que le code. | Matrice sans exigence MVP orpheline. | Non conforme |
| DOC-03 | Journal des décisions d'architecture (`docs/adr/`) : un fichier court par décision structurante (contexte, décision, conséquences, date, statut). | Une décision structurante sans fichier est refusée en revue. | Non conforme |
| DOC-04 | README par application, journal des changements (CHANGELOG) et guide d'exploitation (déploiement, restauration, incident). | Fichiers présents et à jour. | Partiel |
| DOC-05 | La définition de « terminé » du §49.11 est appliquée à chaque fonctionnalité. | Liste de contrôle dans chaque demande de fusion. | Non conforme |

### 49.8. Internationalisation (I18)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| I18-01 | Aucun texte d'interface ni message d'erreur en dur : l'API renvoie des codes stables (API-03) et les textes sont dans des catalogues par langue. | Recherche automatique de chaînes en dur. | Non conforme |
| I18-02 | La devise, le fuseau horaire et les formats de date et de montant dépendent d'une configuration de pays (§3.3), non du code. | Un second pays se configure sans modifier le code. | Partiel |

### 49.9. Exploitation (OPS)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| OPS-01 | Journaux structurés (JSON) avec identifiant de requête et identifiant de joueur pseudonymisé ; jamais de mot de passe, de jeton ni de contenu de message. | Test de non-fuite sur les journaux. | Partiel |
| OPS-02 | Suivi des erreurs du frontend et du backend (Sentry ou équivalent). | Une erreur provoquée apparaît dans l'outil. | Non conforme |
| OPS-03 | Sauvegardes automatiques ; restauration testée à blanc avant chaque version majeure. Objectifs de départ : perte maximale de 24 h, rétablissement en 4 h (à ajuster). | Compte rendu de restauration daté. | Partiel (sauvegarde quotidienne et script de restauration en place ; premier compte rendu de restauration à produire) |
| OPS-04 | Trois environnements (développement, test, production) configurés par variables ; fonctionnalités V2 et V3 derrière des interrupteurs (par exemple le mentor IA). | Un interrupteur désactive une fonctionnalité sans déploiement. | Partiel |
| OPS-05 | Sonde de santé publique et sonde de disponibilité de la base. | Sonde utilisée par le déploiement. | Conforme |
| OPS-06 | Budgets de performance : routes de jeu sous 300 ms au 95e centile ; JavaScript initial d'au plus 200 ko compressé ; interface utilisable sur réseau mobile lent (§43). | Mesure automatique à chaque version. | Non conforme |
| OPS-07 | Base de production PostgreSQL (§27.3) ; SQLite réservée au développement. | Le déploiement échoue sans base PostgreSQL. | Conforme (production : `DATABASE_URL` obligatoire, test `game.test_database_config`) |

### 49.10. Dépendances, sécurité continue et données personnelles (SEC)

| ID | Exigence | Critère vérifiable | État |
|---|---|---|---|
| SEC-01 | Mises à jour automatiques de dépendances (Dependabot ou Renovate). Faille haute ou critique corrigée sous 7 jours, autre faille sous 30 jours. | Délai mesuré sur les alertes. | Non conforme |
| SEC-02 | Versions figées (fichiers de verrouillage) et audit à chaque intégration continue. | Audit présent dans la CI. | Partiel |
| SEC-03 | Modèle de menace court (STRIDE), revu à chaque version majeure. Journal d'audit en base des actions d'administration et de modération (aujourd'hui dans les journaux applicatifs). | Table d'audit en lecture seule. | Partiel |
| SEC-04 | Données personnelles : durée de conservation définie (par exemple compte inactif 24 mois puis anonymisation), export et suppression à la demande du joueur (§31). | Procédure testée de bout en bout. | Non conforme |
| SEC-05 | Recours de modération : un compte suspendu peut contester via un canal outillé, avec un délai de réponse annoncé (§32). | Parcours de recours testé. | Non conforme |

### 49.11. Définition de « terminé »

Une fonctionnalité est terminée lorsque :

1.  elle cite l'identifiant de l'exigence qu'elle satisfait et met à jour la matrice (DOC-02) ;
2.  toute règle sensible est appliquée et validée côté serveur (ARC-01, ARC-04) ;
3.  elle a des tests unitaires du service, des tests d'intégration de l'API, et un test de
    non-régression si elle corrige un défaut (TST-01, TST-05) ;
4.  elle a des états de chargement, d'erreur et de succès, et passe le contrôle d'accessibilité
    (TST-06) ;
5.  elle ne contient aucun texte en dur (I18-01) ni constante d'équilibrage en dur (BAL-01) ;
6.  si l'action est répétable, l'invariant BAL-02 est testé ;
7.  l'intégration continue est verte, la documentation et le journal des changements sont à jour, et
    une décision structurante est consignée dans un ADR (DOC-03) ;
8.  l'impact sur les mineurs et les données personnelles est examiné lorsqu'elle collecte ou expose
    des données (§31.1).

### 49.12. Ordre de mise en œuvre

| Phase | Exigences | Objectif |
|---|---|---|
| 1. Fondations | QUA-01, QUA-02, QUA-03, SEC-01 | Rien ne se fusionne sans contrôle automatique. |
| 2. Source de vérité | ARC-01, ARC-02, ARC-03, API-01, API-03 | Une règle, un endroit ; le contrat d'API ne dérive plus. |
| 3. Économie et tests | BAL-02, BAL-03, TST-01 à TST-06, BAL-01 | Les exploits sont détectés avant les joueurs. |
| 4. Structure | ORG-01 à ORG-05, ARC-04 | Le code reste lisible quand l'équipe et le périmètre grandissent. |
| 5. Traçabilité | DOC-01 à DOC-05 | Chaque exigence se retrouve dans le code et dans un test. |
| 6. Exploitation | OPS-01 à OPS-07, I18-01, I18-02, SEC-02 à SEC-05 | Prêt pour des utilisateurs réels. |

**Avant toute ouverture au public :** QUA-01, QUA-02, OPS-02, OPS-03, OPS-07, SEC-04, SEC-05 et la
revue juridique du §31.1.
