# Architecture de la Plateforme (C4 Model & UML)

Ce document décrit l'architecture de la plateforme e-learning en s'appuyant sur le modèle C4 pour la structuration globale, complété par des diagrammes UML pour détailler les comportements, la structure des données et le déploiement.

---

## 1. Modèle C4

### Niveau 1 : Context Diagram (Diagramme de Contexte)
Le diagramme de contexte montre le système global de la plateforme e-learning et ses interactions avec les acteurs externes.

```mermaid
flowchart TD
    title["C4 Level 1: System Context Diagram"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px
    
    Learner((Learner))
    Instructor((Instructor))
    
    System[Plateforme E-learning]
    
    Learner -->|Consulte les cours, interagit avec l'IA, soumet des feedbacks| System
    Instructor -->|Crée des cours, gère les leçons, consulte les analytiques| System
```

### Niveau 2 : Container Diagram (Diagramme de Conteneurs)
Le diagramme de conteneurs décompose le système en applications, bases de données et microservices.

```mermaid
flowchart TD
    title["C4 Level 2: Container Diagram"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    Learner((Learner))
    Instructor((Instructor))

    Gateway["API Gateway<br/>(Nginx)"]
    Frontend["Learning Portal<br/>(Next.js, React)"]
    
    UserSvc["User Service<br/>(Node.js, Express)"]
    CourseSvc["Course Service<br/>(Python, FastAPI)"]
    AnalyticsSvc["Analytics Service<br/>(Python, FastAPI)"]
    AITutorSvc["AI Tutor Service<br/>(Python, FastAPI)"]
    n8n["n8n Automation<br/>(Node.js)"]
    
    DB_User[("User DB<br/>MongoDB")]
    DB_Course[("Course & Analytics DB<br/>PostgreSQL")]
    Cache_Redis[("Cache<br/>Redis")]
    Storage[("Object Storage<br/>MinIO")]
    Ollama["Local LLM<br/>Ollama Llama3"]

    Learner --> Gateway
    Instructor --> Gateway
    
    Gateway --> Frontend
    Gateway --> UserSvc
    Gateway --> CourseSvc
    Gateway --> AnalyticsSvc
    Gateway --> AITutorSvc
    
    UserSvc --> DB_User
    CourseSvc --> DB_Course
    CourseSvc --> Storage
    AnalyticsSvc --> DB_Course
    AnalyticsSvc --> Cache_Redis
    AITutorSvc --> Ollama
    
    CourseSvc -.->|Déclenche un Webhook| n8n
    n8n -.->|Analyse IA & Insights| AnalyticsSvc
```

### Niveau 3 : Component Diagram (Diagramme de Composants)
Chaque microservice (Course, User, Analytics, AI Tutor) adopte une architecture en couches standard (Contrôleurs, Services, DAO/Repositories). Voici l'exemple détaillé pour le microservice des cours (`course-service`).

```mermaid
flowchart TD
    title["C4 Level 3: Component Diagram - Architecture des Microservices (Ex: Course Service)"]
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

#### User Service
```mermaid
flowchart TD
    title["C4 Level 3: Component Diagram - User Service"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    API["Couche API / Routeurs<br/>(Express Routers)"]
    AuthCtrl["Auth Controller"]
    UserCtrl["User Controller"]
    
    ServiceLayer["Couche Service / Logique Métier"]
    AuthLogic["Auth Service<br/>(JWT, bcrypt)"]
    UserLogic["User Service"]
    
    DAOLayer["Couche Accès aux Données / DAO"]
    UserRepo["User Repository<br/>(Mongoose)"]

    DB[("User DB<br/>MongoDB")]

    API --> AuthCtrl & UserCtrl
    AuthCtrl --> AuthLogic
    UserCtrl --> UserLogic
    
    AuthLogic --> UserRepo
    UserLogic --> UserRepo
    
    UserRepo --> DB
```

#### Analytics Service
```mermaid
flowchart TD
    title["C4 Level 3: Component Diagram - Analytics Service"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    API["Couche API / Routeurs<br/>(FastAPI Routers)"]
    MetricsCtrl["Metrics Controller"]
    EventsCtrl["Events Controller"]
    
    ServiceLayer["Couche Service / Logique Métier"]
    MetricsLogic["Metrics Service"]
    EventsLogic["Events Service"]
    
    DAOLayer["Couche Accès aux Données / DAO"]
    MetricsRepo["Metrics Repository"]
    EventsRepo["Events Repository"]

    DB[("Course & Analytics DB<br/>PostgreSQL")]
    Cache[("Cache<br/>Redis")]

    API --> MetricsCtrl & EventsCtrl
    MetricsCtrl --> MetricsLogic
    EventsCtrl --> EventsLogic
    
    MetricsLogic --> MetricsRepo
    EventsLogic --> EventsRepo
    
    MetricsRepo --> DB
    EventsRepo --> DB
    MetricsLogic -.-> Cache
```

#### AI Tutor Service
```mermaid
flowchart TD
    title["C4 Level 3: Component Diagram - AI Tutor Service"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    API["Couche API / Routeurs<br/>(FastAPI Routers)"]
    ChatCtrl["Chat Controller"]
    QuizCtrl["Quiz Controller"]
    
    ServiceLayer["Couche Service / Logique Métier"]
    PromptLogic["Prompt Builder Service"]
    LLMLogic["LLM Orchestration Service"]
    
    External["Modèle Local"]
    Ollama["Ollama Local LLM<br/>(Llama 3)"]

    API --> ChatCtrl & QuizCtrl
    ChatCtrl --> LLMLogic
    QuizCtrl --> LLMLogic
    
    LLMLogic --> PromptLogic
    LLMLogic --> Ollama
```

---

## 2. Diagrammes UML

### Diagramme de Cas d'Utilisation (Use Case Diagram)
Il représente les interactions possibles entre les acteurs (Learners et Instructors) et les fonctionnalités de la plateforme.

```mermaid
flowchart LR
    classDef actor  fill:none,stroke:none,font-weight:bold,font-size:14px,color:#1a1a2e
    classDef uc     fill:#EEF4FF,stroke:#4A6CF7,stroke-width:1.5px,color:#1a1a2e,rx:30,ry:30
    classDef sys    fill:#F8F9FF,stroke:#A0AEC0,stroke-width:2px,color:#1a1a2e
    classDef group  fill:#F0F4FF,stroke:#BCC8F5,stroke-dasharray:4 2,color:#4A6CF7,font-weight:bold

    Learner["fa:fa-user Learner"]:::actor
    Instructor["fa:fa-user-tie Instructor"]:::actor

    subgraph sys ["  ⬚  E-Learning Platform  "]
        direction TB

        subgraph g1 ["① Registration & Authentication"]
            UC1("Register"):::uc
            UC2("Login / Logout"):::uc
            UC3("Reset Password"):::uc
        end

        subgraph g2 ["② Course Tracking"]
            UC4("Enroll in a Course"):::uc
            UC5("Watch Lessons"):::uc
            UC6("Track Progress"):::uc
        end

        subgraph g3 ["③ AI Tutor — Q&A & Quiz"]
            UC7("AI Q&A Chat"):::uc
            UC8("Generate AI Quiz"):::uc
        end

        subgraph g4 ["④ Feedback & Analytics"]
            UC9("Submit Feedback"):::uc
            UC10("View Analytics Dashboard"):::uc
            UC11("Manage Courses & Lessons"):::uc
        end
    end

    %% ── Learner associations ────────────────────────────────
    Learner --> UC1
    Learner --> UC2
    Learner --> UC4
    Learner --> UC5
    Learner --> UC6
    Learner --> UC7
    Learner --> UC9

    %% ── Instructor associations ─────────────────────────────
    Instructor --> UC1
    Instructor --> UC2
    Instructor --> UC10
    Instructor --> UC11

    %% ── UML stereotypes ─────────────────────────────────────
    UC4 -. "<<include>>" .-> UC2
    UC7 -. "<<extend>>"  .-> UC8
    UC5 -. "<<include>>" .-> UC4
    UC6 -. "<<include>>" .-> UC5
    UC1 -. "<<include>>" .-> UC3
```

### Diagramme de Classes (Class Diagram)
It models the structure of the main data entities and their relationships across all microservices.

```mermaid
classDiagram
    direction LR

    %% ── USER SERVICE (MongoDB) ──────────────────────────────
    namespace UserService {
        class User {
            +ObjectId  _id
            +String    email
            +String    password
            +String    role
            +Boolean   isVerified
            +Date      lastLogin
            +String    emailVerificationToken
            +Date      emailVerificationTokenExpires
            +String    passwordResetToken
            +Date      passwordResetTokenExpires
            +String    pendingEmail
            +String    emailUpdateToken
            +Date      emailUpdateTokenExpires
            +Date      createdAt
            +Date      updatedAt
            +login()
            +register()
            +comparePassword()
        }

        class Profile {
            +String  firstName
            +String  lastName
            +String  phone
            +String  avatar
            +Date    dateOfBirth
        }

        class Address {
            +String  street
            +String  city
            +String  state
            +String  country
            +String  zipCode
        }

        class Instructor {
            +getCourses()
            +getAnalytics()
        }

        class Learner {
            +getEnrollments()
            +askAITutor()
            +submitFeedback()
        }
    }

    %% ── COURSE SERVICE (PostgreSQL) ─────────────────────────
    namespace CourseService {
        class Course {
            +UUID    id
            +String  instructor_id
            +String  title
            +String  description
            +String  short_description
            +Float   price
            +String  category
            +String  subcategory
            +String  level
            +Integer duration_hours
            +String  thumbnail_url
            +Boolean published
            +Boolean is_featured
            +Float   rating
            +Integer total_ratings
            +Integer total_enrollments
            +Date    created_at
            +Date    updated_at
            +addLesson()
            +publish()
        }

        class Lesson {
            +UUID    id
            +UUID    course_id
            +String  title
            +String  description
            +String  content_type
            +String  content_url
            +Integer duration_minutes
            +Integer order_index
            +Boolean is_preview
            +Boolean is_published
            +Date    created_at
            +Date    updated_at
            +complete()
        }

        class Enrollment {
            +UUID    id
            +String  user_id
            +UUID    course_id
            +Date    enrolled_at
            +Boolean completed
            +Float   progress_percentage
            +Date    last_accessed_at
            +Date    completed_at
            +Integer total_time_spent_minutes
            +UUID    last_lesson_id
            +Date    created_at
            +Date    updated_at
            +updateProgress()
        }

        class LessonProgress {
            +UUID    id
            +UUID    enrollment_id
            +UUID    lesson_id
            +UUID    course_id
            +Boolean completed
            +Integer time_spent_minutes
            +Date    last_accessed_at
            +Date    completed_at
            +Date    created_at
            +Date    updated_at
        }

        class Feedback {
            +UUID    id
            +UUID    course_id
            +String  user_id
            +Integer rating
            +String  comment
            +String  ai_summary
            +Date    created_at
            +Date    updated_at
        }
    }

    %% ── ANALYTICS SERVICE (PostgreSQL) ──────────────────────
    namespace AnalyticsService {
        class AnalyticsEvent {
            +UUID      id
            +EventType event_type
            +String    user_id
            +UUID      course_id
            +UserRole  user_role
            +Date      created_at
            +Date      updated_at
        }

        class CourseDailyMetric {
            +UUID    id
            +UUID    course_id
            +Date    metric_date
            +Integer views_count
            +Integer enrollments_count
            +Date    created_at
            +Date    updated_at
        }
    }

    %% ── Inheritance ─────────────────────────────────────────
    User <|-- Instructor : inherits
    User <|-- Learner    : inherits

    %% ── Composition within User Service ────────────────────
    User *-- Profile : has
    User *-- Address : has

    %% ── Cross-service links (logical) ───────────────────────
    Instructor "1" --> "*" Course         : creates
    Learner    "1" --> "*" Enrollment     : enrolls in
    Learner    "1" --> "*" Feedback       : submits
    User       "1" ..> "*" AnalyticsEvent : triggers

    %% ── Course Service internal ─────────────────────────────
    Course     "1" *-- "*" Lesson         : contains
    Course     "1" *-- "*" Enrollment     : has
    Course     "1" *-- "*" Feedback       : receives
    Enrollment "1" *-- "*" LessonProgress : tracks
    Course     "1" --> "*" LessonProgress : scoped to
    Lesson     "1" ..> "*" LessonProgress : referenced by

    %% ── Analytics Service ───────────────────────────────────
    Course "1" --> "*" AnalyticsEvent    : generates
    Course "1" --> "*" CourseDailyMetric : aggregated in

```

### Diagramme de Séquence (Sequence Diagram)
Exemple de flux métier : Inscription ➔ Accès au cours ➔ Interaction AI Tutor ➔ Feedback ➔ n8n Workflow.

```mermaid
sequenceDiagram
    actor Learner
    participant Portal as Learning Portal
    participant UserSvc as User Service
    participant CourseSvc as Course Service
    participant AISvc as AI Tutor Service
    participant n8n as n8n Automation
    
    Learner->>Portal: S'inscrit & Se connecte
    Portal->>UserSvc: POST /api/v1/users/register & /login
    UserSvc-->>Portal: Retourne le Token JWT
    
    Learner->>Portal: S'inscrit au Cours
    Portal->>CourseSvc: POST /api/v1/enrollments/
    CourseSvc-->>Portal: Inscription réussie
    
    Learner->>Portal: Regarde la leçon & Pose une question
    Portal->>AISvc: POST /api/v1/tutor/chat
    AISvc-->>Portal: Retourne la réponse de l'IA (Ollama)
    
    Learner->>Portal: Termine le cours & Laisse un Feedback
    Portal->>CourseSvc: POST /api/v1/feedback/
    CourseSvc-->>Portal: Feedback Sauvegardé
    CourseSvc->>n8n: Déclenche Webhook (Asynchrone)
    
    n8n->>n8n: Analyse de sentiment via IA (LLM)
    n8n->>UserSvc: Récupère les infos de l'Instructor
    n8n->>Instructor: Notifie l'Instructor (Email/Alerte)
```

### Diagramme de Déploiement (Deployment Diagram)
Représente l'infrastructure Docker sous-jacente, les conteneurs instanciés, leurs ports exposés et les liaisons réseaux gérées via Docker Compose.

```mermaid
flowchart TD
    title["UML Deployment Diagram - Architecture Docker"]
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
    
    Client((Navigateur Learner/Instructor)) -->|HTTP:80| Gateway
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
    AnalyticsSvc -->|Redis-py| Redis
    AITutorSvc -->|API Rest| Ollama
```
