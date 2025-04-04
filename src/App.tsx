import { Routes, Route, Outlet, useLocation, useNavigationType } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { lazy, Suspense, useEffect } from "react";
import Loader from "./components/Loader.tsx";

// Styled fallback component for route transitions
const StyledFallback = () => (
  <div className="fixed inset-0 bg-gradient-to-b from-purple-800 to-purple-600 bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-[9999]">
    <div className="bg-white/10 p-8 rounded-xl shadow-2xl">
      <Loader />
    </div>
  </div>
);

// Loading fallback component for routes
// const RouteLoading = () => (
//   <div className="flex items-center justify-center h-screen bg-purple-50">
//     <div className="text-purple-700 text-xl font-semibold">Loading...</div>
//   </div>
// );

// Lazy load routes to reduce initial bundle size
const Calendar = lazy(() => import("./routes/Calendar"));
const Interface = lazy(() => import("./routes/Interface"));
const QuizInterface = lazy(() => import("./routes/QuizInterface"));
const Resources = lazy(() => import("./routes/Resources"));
const EnhancedAskQuestion = lazy(() => import("./routes/EnhancedAskQuestion"));
const TeacherInterface = lazy(() => import("./routes/TeacherInterface"));
const Home = lazy(() => import("./routes/Home"));
const Login = lazy(() => import("./routes/Login"));
const Profile = lazy(() => import("./routes/Profile"));
const AIpage = lazy(() => import("./routes/AIpage"));
const ForgotPass = lazy(() => import("./routes/ForgotPass"));
const PreLogin = lazy(() => import("./routes/PreLogin"));
const Bookmark = lazy(() => import("./routes/Bookmark"));
const TeacherLogin = lazy(() => import("./routes/TeacherLogin"));
const TeacherForgot = lazy(() => import("./routes/TeacherForgot"));
const Solutions = lazy(() => import("./routes/Solutions"));
const Register = lazy(() => import("./routes/Register"));

// Define the App component structure first
const AppContent = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { isAppLoading, showAppLoader, hideAppLoader, isLoading } = useUser();

  // Show loader on initial load
  useEffect(() => {
    // Only for initial page load
    showAppLoader();
  }, [showAppLoader]);
  
  // Show loader on route changes
  useEffect(() => {
    // Only trigger on actual navigation (not on initial render)
    if (navigationType !== 'POP') {
      showAppLoader();
      
      // Hide loader after navigation completes
      const timerId = setTimeout(() => {
        hideAppLoader();
      }, 100); // Small delay to ensure the navigation has started
      
      return () => clearTimeout(timerId);
    }
  }, [location.pathname, showAppLoader, hideAppLoader, navigationType]);

  return (
    <>
      {/* Show loader when app is loading or when initial data is loading */}
      {(isAppLoading || isLoading) && (
        <StyledFallback />
      )}
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={null}>
            <Login />
          </Suspense>
        } />
        <Route path="/home" element={
          <Suspense fallback={null}>
            <Home />
          </Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={null}>
            <Profile />
          </Suspense>
        } />
        <Route path="/calendar" element={
          <Suspense fallback={null}>
            <Calendar />
          </Suspense>
        } />
        <Route path="/interface" element={
          <Suspense fallback={null}>
            <Interface />
          </Suspense>
        } />
        <Route path="/quiz" element={
          <Suspense fallback={null}>
            <QuizInterface />
          </Suspense>
        } />
        <Route path="/resources" element={
          <Suspense fallback={null}>
            <Resources />
          </Suspense>
        } />
        <Route path="/ask" element={
          <Suspense fallback={null}>
            <EnhancedAskQuestion />
          </Suspense>
        } />
        <Route path="/teacher" element={
          <Suspense fallback={null}>
            <TeacherInterface />
          </Suspense>
        } />
        <Route path="/ai" element={
          <Suspense fallback={null}>
            <AIpage />
          </Suspense>
        } />
        <Route path="/forgot" element={
          <Suspense fallback={null}>
            <ForgotPass />
          </Suspense>
        } />
        <Route path="/" element={
          <Suspense fallback={null}>
            <PreLogin />
          </Suspense>
        } />
        <Route path="/bookmark" element={
          <Suspense fallback={null}>
            <Bookmark />
          </Suspense>
        } />
        <Route path="/tlogin" element={
          <Suspense fallback={null}>
            <TeacherLogin />
          </Suspense>
        } />
        <Route path="/tforgot" element={
          <Suspense fallback={null}>
            <TeacherForgot />
          </Suspense>
        } />
        <Route path="/solutions/:id" element={
          <Suspense fallback={null}>
            <Solutions/>
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={null}>
            <Register/>
          </Suspense>
        } />
      </Routes>
    </>
  );
}

// Wrap AppContent with the provider
const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;
