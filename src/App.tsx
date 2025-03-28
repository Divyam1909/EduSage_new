import { Routes, Route, Outlet } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { lazy, Suspense } from "react";

// Loading fallback component for routes
const RouteLoading = () => (
  <div className="flex items-center justify-center h-screen bg-purple-50">
    <div className="text-purple-700 text-xl font-semibold">Loading...</div>
  </div>
);

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

const App = () => {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<RouteLoading />}>
            <Login />
          </Suspense>
        } />
        <Route path="/home" element={
          <Suspense fallback={<RouteLoading />}>
            <Home />
          </Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<RouteLoading />}>
            <Profile />
          </Suspense>
        } />
        <Route path="/calendar" element={
          <Suspense fallback={<RouteLoading />}>
            <Calendar />
          </Suspense>
        } />
        <Route path="/interface" element={
          <Suspense fallback={<RouteLoading />}>
            <Interface />
          </Suspense>
        } />
        <Route path="/quiz" element={
          <Suspense fallback={<RouteLoading />}>
            <QuizInterface />
          </Suspense>
        } />
        <Route path="/resources" element={
          <Suspense fallback={<RouteLoading />}>
            <Resources />
          </Suspense>
        } />
        <Route path="/ask" element={
          <Suspense fallback={<RouteLoading />}>
            <EnhancedAskQuestion />
          </Suspense>
        } />
        <Route path="/teacher" element={
          <Suspense fallback={<RouteLoading />}>
            <TeacherInterface />
          </Suspense>
        } />
        <Route path="/ai" element={
          <Suspense fallback={<RouteLoading />}>
            <AIpage />
          </Suspense>
        } />
        <Route path="/forgot" element={
          <Suspense fallback={<RouteLoading />}>
            <ForgotPass />
          </Suspense>
        } />
        <Route path="/" element={
          <Suspense fallback={<RouteLoading />}>
            <PreLogin />
          </Suspense>
        } />
        <Route path="/bookmark" element={
          <Suspense fallback={<RouteLoading />}>
            <Bookmark />
          </Suspense>
        } />
        <Route path="/tlogin" element={
          <Suspense fallback={<RouteLoading />}>
            <TeacherLogin />
          </Suspense>
        } />
        <Route path="/tforgot" element={
          <Suspense fallback={<RouteLoading />}>
            <TeacherForgot />
          </Suspense>
        } />
        <Route path="/solutions/:id" element={
          <Suspense fallback={<RouteLoading />}>
            <Solutions/>
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<RouteLoading />}>
            <Register/>
          </Suspense>
        } />
      </Routes>
    </UserProvider>
  );
};

export default App;
