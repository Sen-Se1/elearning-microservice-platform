# Platform Architecture (C4 Model & UML)

This document describes the architecture of the e-learning platform based on the C4 model for overall structuring, complemented by UML diagrams to detail behaviors, data structure, and deployment.

---

## 1. C4 Model

### Level 1: Context Diagram
The context diagram shows the overall system of the e-learning platform and its interactions with external actors.

```mermaid
flowchart TD
    title["C4 Level 1: System Context Diagram"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px
    
    Learner((Learner))
    Instructor((Instructor))
    
    System[E-learning Platform]
    
    Learner -->|Browses courses, interacts with AI, submits feedback| System
    Instructor -->|Creates courses, manages lessons, views analytics| System
```

### Level 2: Container Diagram
The container diagram breaks down the system into applications, databases, and microservices.

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
    
    CourseSvc -.->|Triggers a Webhook| n8n
    n8n -.->|AI Analysis & Insights| AnalyticsSvc
```

### Level 3: Component Diagram
Each microservice (Course, User, Analytics, AI Tutor) adopts a standard layered architecture (Controllers, Services, DAO/Repositories). Here is the detailed example for the course microservice (`course-service`).

```mermaid
flowchart TD
    title["C4 Level 3: Component Diagram - Microservices Architecture (Ex: Course Service)"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    API["API / Routers Layer<br/>(FastAPI Routers)"]
    CourseCtrl["Course Controller"]
    LessonCtrl["Lesson Controller"]
    EnrollmentCtrl["Enrollment Controller"]
    FeedbackCtrl["Feedback Controller"]
    
    ServiceLayer["Service / Business Logic Layer"]
    CourseLogic["Course Logic"]
    LessonLogic["Lesson Logic"]
    EnrollmentLogic["Enrollment Logic"]
    FeedbackLogic["Feedback Logic"]
    
    DAOLayer["Data Access / DAO Layer"]
    CourseRepo["Course Repository"]
    LessonRepo["Lesson Repository"]
    EnrollmentRepo["Enrollment Repository"]
    FeedbackRepo["Feedback Repository"]

    DB[("Database")]
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
    
    FeedbackLogic -.->|Sends feedback data| n8n

    CourseRepo & LessonRepo & EnrollmentRepo & FeedbackRepo --> DB
```

#### User Service
```mermaid
flowchart TD
    title["C4 Level 3: Component Diagram - User Service"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    API["API / Routers Layer<br/>(Express Routers)"]
    AuthCtrl["Auth Controller"]
    UserCtrl["User Controller"]
    
    ServiceLayer["Service / Business Logic Layer"]
    AuthLogic["Auth Service<br/>(JWT, bcrypt)"]
    UserLogic["User Service"]
    
    DAOLayer["Data Access / DAO Layer"]
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

    API["API / Routers Layer<br/>(FastAPI Routers)"]
    MetricsCtrl["Metrics Controller"]
    EventsCtrl["Events Controller"]
    
    ServiceLayer["Service / Business Logic Layer"]
    MetricsLogic["Metrics Service"]
    EventsLogic["Events Service"]
    
    DAOLayer["Data Access / DAO Layer"]
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

    API["API / Routers Layer<br/>(FastAPI Routers)"]
    ChatCtrl["Chat Controller"]
    QuizCtrl["Quiz Controller"]
    
    ServiceLayer["Service / Business Logic Layer"]
    PromptLogic["Prompt Builder Service"]
    LLMLogic["LLM Orchestration Service"]
    
    External["Local Model"]
    Ollama["Ollama Local LLM<br/>(Llama 3)"]

    API --> ChatCtrl & QuizCtrl
    ChatCtrl --> LLMLogic
    QuizCtrl --> LLMLogic
    
    LLMLogic --> PromptLogic
    LLMLogic --> Ollama
```

---

## 2. UML Diagrams

### Use Case Diagram
It represents the possible interactions between actors (Learners and Instructors) and the platform's features.

```mermaid
flowchart LR
    classDef actor  fill:none,stroke:none,font-weight:bold,font-size:14px,color:#1a1a2e
    classDef uc     fill:#EEF4FF,stroke:#4A6CF7,stroke-width:1.5px,color:#1a1a2e,rx:30,ry:30
    classDef sys    fill:#F8F9FF,stroke:#A0AEC0,stroke-width:2px,color:#1a1a2e

    %% Left Actors (Users)
    Guest["fa:fa-user Guest"]:::actor
    User["fa:fa-users User"]:::actor
    Learner["fa:fa-user-graduate Learner"]:::actor
    Instructor["fa:fa-user-tie Instructor"]:::actor

    %% Right Actors (External Systems)
    Ollama["fa:fa-server AI Tutor (Ollama)"]:::sys
    N8N["fa:fa-cogs n8n Automation"]:::sys
    AnalyticSvc["fa:fa-chart-line Analytics Service"]:::sys

    %% Actor Generalization
    Learner -. "inherits" .-> User
    Instructor -. "inherits" .-> User

    subgraph Platform ["  ⬚  E-Learning Platform  "]
        direction TB

        UC_Browse("Browse Catalog"):::uc
        UC_Reg("Register Account"):::uc
        UC_Login("Log In"):::uc
        UC_Verify("Verify Identity"):::uc
        UC_Reset("Reset Password"):::uc

        UC_Enroll("Enroll in a Course"):::uc
        UC_Watch("Watch Lessons"):::uc
        UC_Track("Track Progress"):::uc

        UC_Chat("AI Q&A Chat"):::uc
        UC_Quiz("Generate AI Quiz"):::uc
        UC_Feedback("Submit Feedback"):::uc
        
        UC_Manage("Manage Courses & Lessons"):::uc
        UC_Analytics("View Analytics Dashboard"):::uc
    end

    %% ── Primary Actor associations (Left) ───────────────────
    Guest --- UC_Browse
    Guest --- UC_Reg
    User --- UC_Login

    Learner --- UC_Enroll
    Learner --- UC_Watch
    Learner --- UC_Feedback

    Instructor --- UC_Manage
    Instructor --- UC_Analytics

    %% ── UML Stereotypes (Includes & Extends) ────────────────
    UC_Reg -. "<<Includes>>" .-> UC_Verify
    UC_Login -. "<<Includes>>" .-> UC_Verify
    UC_Reset -. "<<Extends>>" .-> UC_Login
    
    UC_Enroll -. "<<Includes>>" .-> UC_Login
    UC_Watch -. "<<Includes>>" .-> UC_Login
    UC_Manage -. "<<Includes>>" .-> UC_Login
    UC_Analytics -. "<<Includes>>" .-> UC_Login
    
    UC_Track -. "<<Extends>>" .-> UC_Watch
    UC_Chat -. "<<Extends>>" .-> UC_Watch
    UC_Quiz -. "<<Extends>>" .-> UC_Chat

    %% ── Secondary Actor associations (Right) ────────────────
    UC_Chat --- Ollama
    UC_Quiz --- Ollama
    UC_Feedback --- N8N
    UC_Enroll --- AnalyticSvc
    UC_Analytics --- AnalyticSvc
```

### Class Diagram
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

### Sequence Diagram
Example business flow: Registration ➔ Course Access ➔ AI Tutor Interaction ➔ Feedback ➔ n8n Workflow.

```mermaid
sequenceDiagram
    actor Learner
    participant Portal as Learning Portal
    participant UserSvc as User Service
    participant CourseSvc as Course Service
    participant AISvc as AI Tutor Service
    participant n8n as n8n Automation
    
    Learner->>Portal: Registers & Logs in
    Portal->>UserSvc: POST /api/v1/users/register & /login
    UserSvc-->>Portal: Returns JWT Token
    
    Learner->>Portal: Enrolls in Course
    Portal->>CourseSvc: POST /api/v1/enrollments/
    CourseSvc-->>Portal: Enrollment successful
    
    Learner->>Portal: Watches lesson & Asks a question
    Portal->>AISvc: POST /api/v1/tutor/chat
    AISvc-->>Portal: Returns AI response (Ollama)
    
    Learner->>Portal: Completes course & Leaves Feedback
    Portal->>CourseSvc: POST /api/v1/feedback/
    CourseSvc-->>Portal: Feedback Saved
    CourseSvc->>n8n: Triggers Webhook (Asynchronous)
    
    n8n->>n8n: Sentiment analysis via AI (LLM)
    n8n->>UserSvc: Fetches Instructor info
    n8n->>Instructor: Notifies Instructor (Email/Alert)
```

### Deployment Diagram
Represents the underlying Docker infrastructure, instantiated containers, their exposed ports, and network links managed via Docker Compose.

```mermaid
flowchart TD
    title["UML Deployment Diagram - Architecture Docker"]
    style title fill:none,stroke:none,font-weight:bold,font-size:16px

    subgraph Host[Server / Docker Host Machine]
        subgraph DockerNetwork[Docker Network: learning-platform]
            Gateway["Container: api-gateway<br/>Internal port: 8000<br/>External port: 80"]
            
            Frontend["Container: learning-portal<br/>Port: 3000"]
            
            UserSvc["Container: user-service<br/>Port: 8002"]
            CourseSvc["Container: course-service<br/>Port: 8001"]
            AnalyticsSvc["Container: analytics-service<br/>Port: 8003"]
            AITutorSvc["Container: ai-tutor-service<br/>Port: 8004"]
            N8N["Container: n8n<br/>External port: 5678"]
            
            Ollama["Container: ollama<br/>Port: 11434"]
            
            PG[("Container: postgres<br/>Port: 5432")]
            Mongo[("Container: mongo<br/>Port: 27017")]
            Redis[("Container: redis<br/>Port: 6379")]
            Minio[("Container: minio<br/>Port: 9000")]
        end
    end
    
    Client((Browser Learner/Instructor)) -->|HTTP:80| Gateway
    Admin((Administrator)) -->|HTTP:5678| N8N
    
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
