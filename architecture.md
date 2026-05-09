# Architecture de la Plateforme (C4 Model & UML)

Ce document décrit l'architecture de la plateforme e-learning en s'appuyant sur le modèle C4 pour la structuration globale, complété par des diagrammes UML pour détailler les comportements, la structure des données et le déploiement.

---

## 1. Modèle C4

### Niveau 1 : Context Diagram (Diagramme de Contexte)
Le diagramme de contexte montre le système global de la plateforme e-learning et ses interactions avec les acteurs externes.

```mermaid
flowchart TD
    title[C4 Level 1: System Context Diagram]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px
    
    Student((Apprenant))
    Instructor((Instructeur))
    
    System[Plateforme E-learning]
    
    Student -->|Consulte les cours, interagit avec l'IA, soumet des feedbacks| System
    Instructor -->|Crée des cours, gère les leçons, consulte les analytiques| System
```

### Niveau 2 : Container Diagram (Diagramme de Conteneurs)
Le diagramme de conteneurs décompose le système en applications, bases de données et microservices.

```mermaid
flowchart TD
    title[C4 Level 2: Container Diagram]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    Student((Apprenant))
    Instructor((Instructeur))

    Gateway["API Gateway<br/>(Nginx)"]
    Frontend["Learning Portal<br/>(Next.js, React)"]
    
    UserSvc["User Service<br/>(Node.js, Express)"]
    CourseSvc["Course Service<br/>(Python, FastAPI)"]
    AnalyticsSvc["Analytics Service<br/>(Python, FastAPI)"]
    AITutorSvc["AI Tutor Service<br/>(Python, FastAPI)"]
    n8n["n8n Automation<br/>(Node.js)"]
    
    DB_User[("User DB<br/>MongoDB")]
    DB_Course[("Course DB<br/>PostgreSQL")]
    DB_Analytics[("Analytics DB<br/>PostgreSQL")]
    Cache_AI[("Cache<br/>Redis")]
    Storage[("Object Storage<br/>MinIO")]
    Ollama["Local LLM<br/>Ollama Llama3"]

    Student --> Gateway
    Instructor --> Gateway
    
    Gateway --> Frontend
    Gateway --> UserSvc
    Gateway --> CourseSvc
    Gateway --> AnalyticsSvc
    Gateway --> AITutorSvc
    
    UserSvc --> DB_User
    CourseSvc --> DB_Course
    CourseSvc --> Storage
    AnalyticsSvc --> DB_Analytics
    AITutorSvc --> Cache_AI
    AITutorSvc --> Ollama
    
    CourseSvc -.->|Déclenche un Webhook| n8n
    n8n -.->|Analyse IA & Insights| AnalyticsSvc
```

### Niveau 3 : Component Diagram (Diagramme de Composants)
Chaque microservice (Course, User, Analytics, AI Tutor) adopte une architecture en couches standard (Contrôleurs, Services, DAO/Repositories). Voici l'exemple détaillé pour le microservice des cours (`course-service`).

```mermaid
flowchart TD
    title[C4 Level 3: Component Diagram - Architecture des Microservices (Ex: Course Service)]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    API["Couche API / Routeurs<br/>(FastAPI Routers)"]
    CourseCtrl["Course Controller"]
    LessonCtrl["Lesson Controller"]
    EnrollmentCtrl["Enrollment Controller"]
    FeedbackCtrl["Feedback Controller"]
    
    ServiceLayer["Couche Service / Logique Métier"]
    CourseLogic["Course Logic"]
    LessonLogic["Lesson Logic"]
    EnrollmentLogic["Enrollment Logic"]
    FeedbackLogic["Feedback Logic"]
    
    DAOLayer["Couche Accès aux Données / DAO"]
    CourseRepo["Course Repository"]
    LessonRepo["Lesson Repository"]
    EnrollmentRepo["Enrollment Repository"]
    FeedbackRepo["Feedback Repository"]

    DB[("Base de Données")]
    n8n["n8n Webhook"]

    API --> CourseCtrl & LessonCtrl & EnrollmentCtrl & FeedbackCtrl
    CourseCtrl --> CourseLogic
    LessonCtrl --> LessonLogic
    EnrollmentCtrl --> EnrollmentLogic
    FeedbackCtrl --> FeedbackLogic
    
    CourseLogic --> CourseRepo
    LessonLogic --> LessonRepo
    EnrollmentLogic --> EnrollmentRepo
    FeedbackLogic --> FeedbackRepo
    
    FeedbackLogic -.->|Envoi des données de feedback| n8n

    CourseRepo & LessonRepo & EnrollmentRepo & FeedbackRepo --> DB
```

*(Note : Cette même logique de séparation Contrôleur / Service / DAO s'applique au `user-service`, `analytics-service` et `ai-tutor-service` avec leurs entités respectives).*

---

## 2. Diagrammes UML

### Diagramme de Cas d'Utilisation (Use Case Diagram)
Il représente les interactions possibles entre les acteurs (Apprenants et Instructeurs) et les fonctionnalités de la plateforme.

```mermaid
flowchart LR
    title[UML Use Case Diagram]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    Student((Apprenant))
    Instructor((Instructeur))
    
    subgraph E-Learning Platform
        UC1(S'inscrire / Se connecter)
        UC2(Créer et gérer des cours)
        UC3(S'inscrire à un cours)
        UC4(Suivre la progression)
        UC5(Poser des questions à l'IA)
        UC6(Générer des Quiz avec l'IA)
        UC7(Soumettre un feedback)
        UC8(Consulter les statistiques / analytiques)
    end
    
    Student --> UC1
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7
    
    Instructor --> UC1
    Instructor --> UC2
    Instructor --> UC8
```

### Diagramme de Classes (Class Diagram)
Il modélise la structure des entités de données principales et leurs relations.

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String email
        +String password_hash
        +Role role
        +Date created_at
        +login()
        +register()
    }
    
    class Course {
        +UUID id
        +UUID instructor_id
        +String title
        +String description
        +Float price
        +String category
        +Date created_at
        +addLesson()
        +publish()
    }
    
    class Lesson {
        +UUID id
        +UUID course_id
        +String title
        +String content_type
        +String content_url
        +Int order_index
        +complete()
    }
    
    class Enrollment {
        +UUID id
        +UUID user_id
        +UUID course_id
        +Date enrolled_at
        +Float progress
    }
    
    class Feedback {
        +UUID id
        +UUID course_id
        +UUID user_id
        +Int rating
        +String comment
        +String ai_summary
    }

    User "1" -- "*" Course : Enseigne >
    User "1" -- "*" Enrollment : S'inscrit >
    Course "1" -- "*" Lesson : Contient >
    Course "1" -- "*" Enrollment : Possède >
    Course "1" -- "*" Feedback : Reçoit >
    User "1" -- "*" Feedback : Rédige >
```

### Diagramme de Séquence (Sequence Diagram)
Exemple de flux métier : Inscription ➔ Accès au cours ➔ Interaction AI Tutor ➔ Feedback ➔ n8n Workflow.

```mermaid
sequenceDiagram
    actor Student
    participant Portal as Learning Portal
    participant UserSvc as User Service
    participant CourseSvc as Course Service
    participant AISvc as AI Tutor Service
    participant n8n as n8n Automation
    
    Student->>Portal: S'inscrit & Se connecte
    Portal->>UserSvc: POST /api/v1/users/register & /login
    UserSvc-->>Portal: Retourne le Token JWT
    
    Student->>Portal: S'inscrit au Cours
    Portal->>CourseSvc: POST /api/v1/enrollments/
    CourseSvc-->>Portal: Inscription réussie
    
    Student->>Portal: Regarde la leçon & Pose une question
    Portal->>AISvc: POST /api/v1/tutor/chat
    AISvc-->>Portal: Retourne la réponse de l'IA (Ollama)
    
    Student->>Portal: Termine le cours & Laisse un Feedback
    Portal->>CourseSvc: POST /api/v1/feedback/
    CourseSvc-->>Portal: Feedback Sauvegardé
    CourseSvc->>n8n: Déclenche Webhook (Asynchrone)
    
    n8n->>n8n: Analyse de sentiment via IA (LLM)
    n8n->>UserSvc: Récupère les infos de l'Instructeur
    n8n->>Instructor: Notifie l'instructeur (Email/Alerte)
```

### Diagramme de Déploiement (Deployment Diagram)
Représente l'infrastructure Docker sous-jacente, les conteneurs instanciés, leurs ports exposés et les liaisons réseaux gérées via Docker Compose.

```mermaid
flowchart TD
    title[UML Deployment Diagram - Architecture Docker]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    subgraph Host[Serveur / Machine Docker Hôte]
        subgraph DockerNetwork[Docker Network: learning-platform]
            Gateway["Container: api-gateway<br/>Port interne: 8000<br/>Port externe: 80"]
            
            Frontend["Container: learning-portal<br/>Port: 3000"]
            
            UserSvc["Container: user-service<br/>Port: 8002"]
            CourseSvc["Container: course-service<br/>Port: 8001"]
            AnalyticsSvc["Container: analytics-service<br/>Port: 8003"]
            AITutorSvc["Container: ai-tutor-service<br/>Port: 8004"]
            N8N["Container: n8n<br/>Port externe: 5678"]
            
            Ollama["Container: ollama<br/>Port: 11434"]
            
            PG[("Container: postgres<br/>Port: 5432")]
            Mongo[("Container: mongo<br/>Port: 27017")]
            Redis[("Container: redis<br/>Port: 6379")]
            Minio[("Container: minio<br/>Port: 9000")]
        end
    end
    
    Client((Navigateur Apprenant/Instructeur)) -->|HTTP:80| Gateway
    Admin((Administrateur)) -->|HTTP:5678| N8N
    
    Gateway -->|proxy_pass| Frontend
    Gateway -->|proxy_pass| UserSvc
    Gateway -->|proxy_pass| CourseSvc
    Gateway -->|proxy_pass| AnalyticsSvc
    Gateway -->|proxy_pass| AITutorSvc
    
    UserSvc -->|Mongoose| Mongo
    CourseSvc -->|SQLAlchemy| PG
    CourseSvc -->|Boto3| Minio
    AnalyticsSvc -->|SQLAlchemy| PG
    AITutorSvc -->|Redis-py| Redis
    AITutorSvc -->|API Rest| Ollama
```
