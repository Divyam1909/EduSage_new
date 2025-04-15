# EduSage

EduSage is a comprehensive educational platform designed to enhance student learning experiences with AI-powered tools, resource management, and interactive features. The platform bridges the gap between traditional learning and digital innovation, providing both students and educators with powerful tools to improve educational outcomes.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Backend API](#backend-api)
- [Frontend Components](#frontend-components)
- [AI Features](#ai-features)
- [Authentication](#authentication)
- [Usage](#usage)
- [Contributing](#contributing)

## Features

### Student Features
- **User Authentication**: 
  - Secure login system with JWT authentication
  - New user registration with data validation
  - Password recovery via email verification
  - Protection against unauthorized access

- **Dashboard**: 
  - Personalized student dashboard with visual performance metrics
  - Real-time progress tracking across all subjects
  - Notification center for upcoming events and deadlines
  - Quick access to recently used resources and quizzes

- **AI-Powered Q&A**: 
  - Natural language processing for understanding complex questions
  - Contextual answers tailored to academic level
  - Citation of relevant resources for further reading
  - Option to save AI responses for future reference

- **Resource Library**: 
  - Organized repository of study materials by subject and topic
  - PDF, document, and multimedia support
  - Search functionality with filters for easy discovery
  - Rating system to highlight quality resources

- **Interactive Quizzes**: 
  - Multiple quiz formats (multiple choice, short answer, etc.)
  - Real-time feedback on answers
  - Detailed explanations for incorrect responses
  - Adaptive difficulty based on performance
  - Time-limited challenges for exam preparation

- **Performance Tracking**: 
  - Comprehensive analytics on academic progress
  - Subject-wise performance breakdown
  - Historical performance data with trend analysis
  - Comparative metrics against class averages
  - Insights and recommendations for improvement

- **Bookmarks**: 
  - Save important resources, questions, and solutions
  - Organize bookmarks into custom collections
  - Quick access panel from any page
  - Export options for offline study

- **Calendar**: 
  - Visual academic calendar with event management
  - Deadline tracking with reminders
  - Integration with quiz schedules and assignment due dates
  - Custom event creation and recurring events
  - Color-coding by subject or priority

- **Profile Management**: 
  - Comprehensive user profile with academic information
  - Achievement tracking and badges
  - Customizable profile pictures and settings
  - Privacy controls for shared information
  - Academic history and progression visualization

- **Wisdom Points System**: 
  - Gamified learning incentives through point accumulation
  - Points awarded for platform engagement, quiz completion, and helping peers
  - Leaderboards to foster healthy competition
  - Rewards and unlockable features based on points
  - Experience levels with visual progression indicators

### Teacher Features
- **Teacher Dashboard**: 
  - Comprehensive overview of class performance
  - Analytics on student engagement and activity
  - Quick access to teaching resources
  - Notification system for questions and submissions

- **Student Management**: 
  - Detailed profiles of individual student performance
  - Tracking of student engagement with resources
  - Identification of struggling students through analytics
  - Customizable student groups for targeted intervention
  - Progress reports and performance comparisons

- **Resource Uploads**: 
  - Multi-format resource uploading and organization
  - Version control for updated materials
  - Access controls to limit visibility by class or student group
  - Analytics on resource usage and effectiveness
  - Ability to attach resources to specific topics or lessons

- **Quiz Creation**: 
  - Intuitive quiz builder with various question types
  - Option to set time limits and attempt restrictions
  - Automated grading with customizable scoring
  - Question bank for reusing and randomizing questions
  - Detailed performance analytics after quiz completion

- **Question Moderation**: 
  - Review and approval workflow for student questions and answers
  - Quality control of user-generated content
  - Ability to provide feedback on submissions
  - Highlight exemplary answers for student reference
  - Flag and modify incorrect or inappropriate content

## Technology Stack

### Frontend
- **React.js with TypeScript**: 
  - Component-based UI architecture with type safety
  - Reusable UI components for consistent user experience
  - Static typing to reduce runtime errors

- **Vite**: 
  - Fast development server with hot module replacement
  - Optimized production builds with code splitting
  - Modern JavaScript features without complex configuration

- **React Router**: 
  - Declarative routing for single-page application
  - Nested route structures for complex UI hierarchies
  - Protected routes for authenticated content

- **Tailwind CSS**: 
  - Utility-first CSS framework for consistent styling
  - Responsive design capabilities for all device sizes
  - Custom design system implementation

- **Shadcn UI**: 
  - High-quality, accessible UI components
  - Consistent design language across the application
  - Themeable components for visual customization

- **Recharts**: 
  - Interactive and responsive chart components
  - Visualization of performance and analytics data
  - Customizable charts for different data types

- **Axios**: 
  - Promise-based HTTP client for API communication
  - Request/response interception for authentication
  - Error handling and retry mechanisms

### Backend
- **Node.js with Express**: 
  - Fast, non-blocking I/O for handling concurrent requests
  - Middleware architecture for request processing
  - RESTful API design with structured endpoints

- **MongoDB with Mongoose**: 
  - NoSQL database for flexible data modeling
  - Schema validation and relationship management
  - Efficient querying for complex data operations

- **JWT Authentication**: 
  - Stateless authentication using JSON Web Tokens
  - Role-based access control implementation
  - Secure token storage and transmission

- **Bcrypt**: 
  - Secure password hashing with salt rounds
  - Protection against rainbow table and brute force attacks
  - Password verification without storing plaintext

- **Multer**: 
  - Multipart form data processing for file uploads
  - File validation and filtering
  - Storage configuration for uploaded resources

## Installation

### Prerequisites
- Node.js (v16+)
- MongoDB

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/EduSage.git

# Navigate to project directory
cd EduSage

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your MongoDB URI and JWT secret
# Example:
# MONGO_URI=mongodb://localhost:27017/edusage
# JWT_SECRET=your_secret_key

# Start backend server
node server.js
```

## Backend API

The application includes RESTful API endpoints for:

- **User Authentication**:
  - `/register` - Create new user accounts
  - `/login` - Authenticate users and issue JWT tokens
  - `/forgot-password` - Password recovery flow
  - `/reset-password` - Update user passwords securely

- **Resource Management**:
  - `/resources` - CRUD operations for educational resources
  - `/resources/:id` - Get, update or delete specific resources
  - `/resources/upload` - Upload new resource files
  - `/resources/bookmark` - Save resources to user's bookmarks

- **Quiz Management**:
  - `/quizzes` - Create and retrieve quizzes
  - `/quizzes/:id` - Access specific quiz details
  - `/quizzes/attempt` - Record and process quiz attempts
  - `/quizzes/grade` - Automated and manual grading endpoints

- **User Profile**:
  - `/profile` - Retrieve and update user information
  - `/profile/photo` - Manage profile pictures
  - `/profile/stats` - Get detailed user statistics
  - `/profile/achievements` - Manage user achievements

- **Calendar Events**:
  - `/events` - Create and retrieve calendar events
  - `/events/:id` - Manage specific events
  - `/events/upcoming` - Get upcoming events for a user
  - `/events/reminders` - Set and manage event reminders

- **AI Question Answering**:
  - `/ai/question` - Submit questions to AI processing
  - `/ai/history` - Retrieve past AI interactions
  - `/ai/feedback` - Submit feedback on AI responses

- **Performance Metrics**:
  - `/metrics/overview` - General performance overview
  - `/metrics/subjects` - Subject-specific performance data
  - `/metrics/comparison` - Compare performance against peers
  - `/metrics/trends` - Historical performance trends

## Frontend Components

### Main Pages
- **PreLogin**: 
  - Landing page showcasing platform features
  - Testimonials and social proof elements
  - Quick access to login and registration
  - Feature highlights and value proposition

- **Login/Registration**: 
  - Clean, user-friendly authentication forms
  - Form validation with helpful error messages
  - Password strength indicators
  - Social login options (if configured)
  - Secure registration flow with email verification

- **Home**: 
  - Centralized dashboard with performance snapshots
  - Activity feed showing recent platform updates
  - Quick navigation to frequently used features
  - Personalized recommendations based on user behavior
  - Recent notifications and upcoming deadlines

- **Interface**: 
  - Main navigation hub for student interactions
  - Quick access to all platform features
  - Personalized content recommendations
  - Recent activity tracking and resumption points

- **Profile**: 
  - Comprehensive user information management
  - Academic progress visualization
  - Achievement showcase and badges
  - Account settings and privacy controls
  - Performance history with detailed metrics

- **Resources**: 
  - Categorized study materials by subject/topic
  - Search and filter functionality
  - Preview capabilities for different file types
  - Download options for offline access
  - User ratings and recommendation system

- **Quiz Interface**: 
  - Clean, distraction-free quiz-taking environment
  - Timer display for timed assessments
  - Progress indicator for multi-question quizzes
  - Varied question types with appropriate input methods
  - Immediate or delayed feedback based on configuration

- **Calendar**: 
  - Month, week, and day view options
  - Color-coded events by category
  - Drag-and-drop event management
  - Reminder settings and notifications
  - Integration with academic deadlines and institutional schedules

- **AI Page**: 
  - Natural language question input
  - Contextually relevant answer generation
  - Citation of sources for verification
  - Option to refine questions for better answers
  - History of previous questions and answers

- **Bookmarks**: 
  - Organized collection of saved resources
  - Categorization and tagging system
  - Search and filter functionality
  - Quick access to frequently used bookmarks
  - Sharing options for collaborative study

- **Solutions**: 
  - Detailed step-by-step problem solutions
  - Alternate solution approaches when available
  - Related concept explanations
  - Interactive elements for complex solutions
  - Discussion section for clarifications

## AI Features

EduSage integrates advanced AI capabilities to enhance the learning experience:

- **Contextual Question Answering**:
  - Natural language processing for understanding complex academic questions
  - Domain-specific knowledge across multiple subjects
  - Recognition of question intent and educational level
  - Ability to handle ambiguous or incomplete questions

- **Concept Explanations**:
  - Breaking down complex topics into understandable components
  - Multiple explanation approaches for different learning styles
  - Visualization suggestions for abstract concepts
  - Analogies and real-world examples for better comprehension

- **Problem-Solving Assistance**:
  - Step-by-step guidance through difficult problems
  - Identification of common misconceptions and errors
  - Alternative solution methods for diverse approaches
  - Hints system to encourage independent thinking

- **Personalized Learning**:
  - Adaptive content recommendations based on performance
  - Identification of knowledge gaps from quiz results
  - Custom practice question generation for weak areas
  - Learning path suggestions based on goals and progress

### AI Interview Practice
The platform includes an AI-powered interview simulation feature that helps students prepare for job interviews:

- **Personalized Interview Generation**:
  - Custom interviews based on job role, technology stack, and experience level
  - Mix of introductory and technical questions relevant to the specified role
  - Real-time feedback on answers using Google's Gemini API

- **Comprehensive Feedback**:
  - Detailed evaluation of each answer with strengths and areas for improvement
  - Overall interview assessment with scoring and recommendations
  - Technical competence and communication skills evaluation

### Setting Up Gemini API

The AI Interview feature requires a Google Gemini API key to function:

1. If you don't already have one, get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. Add your API key to the `backend/.env` file:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Restart the development server

## Authentication

The platform implements a robust, secure authentication system:

- **JWT Session Management**:
  - Stateless authentication using signed JSON Web Tokens
  - Configurable token expiration and refresh mechanisms
  - Secure transmission with HTTPS
  - Token revocation capabilities for security events

- **Password Security**:
  - Industry-standard bcrypt hashing with multiple salt rounds
  - Password strength requirements enforcement
  - Brute force protection with rate limiting
  - Secure password reset workflows

- **Role-Based Access Control**:
  - Distinct permission sets for students and teachers
  - Granular access controls for sensitive operations
  - Permission validation on both client and server
  - Audit logging for security-relevant actions

- **Account Recovery**:
  - Multi-factor verification for password resets
  - Time-limited recovery tokens
  - Email verification steps to prevent account takeover
  - Notification of account changes for suspicious activity detection

## Usage

### Student Workflow
1. **Register/Login**: Create an account with your academic credentials or log in to an existing account
2. **Dashboard Exploration**: View your performance metrics, upcoming deadlines, and personalized recommendations
3. **Resource Access**: Browse and download study materials filtered by subject, course, or topic
4. **Quiz Participation**: Take assigned quizzes to test your knowledge and receive immediate feedback
5. **AI Assistance**: Use the AI assistant to get help with difficult concepts or questions
6. **Calendar Management**: Track important academic dates, set reminders, and organize your study schedule
7. **Resource Bookmarking**: Save helpful materials for quick access during study sessions
8. **Performance Review**: Regularly check your progress analytics to identify strengths and areas for improvement

### Teacher Workflow
1. **Teacher Portal Access**: Log in through the dedicated teacher interface
2. **Student Monitoring**: Review individual and class performance metrics to identify intervention needs
3. **Content Management**: Upload and organize study materials for student access
4. **Quiz Administration**: Create, assign, and grade quizzes with detailed analytics
5. **Question Management**: Review and respond to student questions for quality assurance
6. **Content Moderation**: Approve user-generated content to maintain academic integrity
7. **Performance Analysis**: Use analytics to improve teaching strategies and resource effectiveness

## Contributing

Contributions to EduSage are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

When contributing, please:
- Follow the existing code style and naming conventions
- Add appropriate tests for new functionality
- Update documentation to reflect your changes
- Ensure all tests pass before submitting pull requests
- Consider performance and accessibility implications
