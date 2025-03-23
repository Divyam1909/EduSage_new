import { Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import {
  Calendar,
  Interface,
  QuizInterface,
  Resources,
  EnhancedAskQuestion,
  TeacherInterface,
  Home,
  Login,
  Profile,
  AIpage,
  ForgotPass,
  PreLogin,
  Bookmark,
  TeacherLogin,
  TeacherForgot,
  Solutions,
  Register,
} from "./routes";

const App = () => {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/interface" element={<Interface />} />
        <Route path="/quiz" element={<QuizInterface />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/ask" element={<EnhancedAskQuestion />} />
        <Route path="/teacher" element={<TeacherInterface />} />
        <Route path="/ai" element={<AIpage />} />
        <Route path="/forgot" element={<ForgotPass />} />
        <Route path="/" element={<PreLogin />} />
        <Route path="/bookmark" element={<Bookmark />} />
        <Route path="/tlogin" element={<TeacherLogin />} />
        <Route path="/tforgot" element={<TeacherForgot />} />
        <Route path="/solutions/:id" element={<Solutions/>}/>
        <Route path="/register" element={<Register/>}/>
      </Routes>
    </UserProvider>
  );
};

export default App;
