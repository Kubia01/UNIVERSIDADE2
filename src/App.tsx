import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import UserDashboard from './components/dashboard/UserDashboard';
import CourseManagement from './components/courses/CourseManagement';
import LessonPlayer from './components/courses/LessonPlayer';
import CertificateList from './components/certificates/CertificateList';
import CertificateManagement from './components/admin/CertificateManagement';
import UserManagement from './components/admin/UserManagement';
import ContentManagement from './components/admin/ContentManagement';
import AdminSettings from './components/admin/AdminSettings';
import NotificationCenter from './components/student/NotificationCenter';
import { Course, Lesson } from './types';

type AuthMode = 'login' | 'register' | 'forgot-password';
type AppView = 'dashboard' | 'courses' | 'certificates' | 'users' | 'content' | 'settings' | 'notifications';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  if (!user) {
    switch (authMode) {
      case 'register':
        return <RegisterForm onToggleMode={() => setAuthMode('login')} />;
      case 'forgot-password':
        return <ForgotPasswordForm onBack={() => setAuthMode('login')} />;
      default:
        return (
          <LoginForm 
            onToggleMode={() => setAuthMode('register')} 
            onForgotPassword={() => setAuthMode('forgot-password')}
          />
        );
    }
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleLessonStart = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  const handleLessonComplete = () => {
    console.log('Lesson completed');
  };

  const handleLessonNavigation = (direction: 'next' | 'previous') => {
    if (!selectedCourse || !selectedLesson) return;
    
    const currentIndex = selectedCourse.lessons.findIndex(l => l.id === selectedLesson.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex + 1;
    } else {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex >= 0 && newIndex < selectedCourse.lessons.length) {
      setSelectedLesson(selectedCourse.lessons[newIndex]);
    }
  };

  const renderMainContent = () => {
    // Show lesson player if a lesson is selected
    if (selectedLesson && selectedCourse) {
      const currentIndex = selectedCourse.lessons.findIndex(l => l.id === selectedLesson.id);
      return (
        <LessonPlayer
          course={selectedCourse}
          lesson={selectedLesson}
          onBack={() => setSelectedLesson(null)}
          onComplete={handleLessonComplete}
          onNext={() => handleLessonNavigation('next')}
          onPrevious={() => handleLessonNavigation('previous')}
          hasNext={currentIndex < selectedCourse.lessons.length - 1}
          hasPrevious={currentIndex > 0}
        />
      );
    }

    // Show main views based on user role
    switch (activeView) {
      case 'dashboard':
        return <UserDashboard />;
      
      case 'courses':
        return (
          <CourseManagement 
            onCourseSelect={handleCourseSelect}
            onStartLesson={handleLessonStart}
            selectedCourse={selectedCourse}
            onBack={() => setSelectedCourse(null)}
          />
        );
      
      case 'certificates':
        return user.role === 'admin' ? <CertificateManagement /> : <CertificateList />;
      
      case 'users':
        return user.role === 'admin' ? <UserManagement /> : <div>Acesso negado</div>;
      
      case 'content':
        return user.role === 'admin' ? <ContentManagement /> : <div>Acesso negado</div>;
      
      case 'settings':
        return user.role === 'admin' ? <AdminSettings /> : <div>Acesso negado</div>;
      
      case 'notifications':
        return <NotificationCenter />;
      
      default:
        return <UserDashboard />;
    }
  };

  // If lesson player is active, render it full screen
  if (selectedLesson && selectedCourse) {
    return renderMainContent();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex">
      <Sidebar 
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view as AppView);
          setSelectedCourse(null);
          setSelectedLesson(null);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;