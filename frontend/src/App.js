import { RouterProvider, createBrowserRouter, Link } from "react-router-dom";
import {
  TeacherDashboard,
  HomeLayout,
  Landing,
  Login,
  Logout,
  Register,
  NewSession,
  StudentDashboard,
  AdminDashboard,
  ForgotPassword,
  AICurriculumAssistant,
} from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "teacher-dashboard",
        element: <TeacherDashboard />,
      },
      {
        path: "student-dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "ai-curriculum-assistant",
        element: <AICurriculumAssistant />,
      },
      {
        path: "attend",
        element: <StudentDashboard />,
      },
      {
        path: "admin-dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "create-session",
        element: <NewSession />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "*",
        element: (
          <div style={{ maxWidth: "480px", margin: "60px auto", textAlign: "center", padding: "20px" }}>
            <div className="modern-card" style={{ padding: "36px" }}>
              <h1 style={{ fontSize: "54px", margin: "0 0 10px 0", color: "var(--primary-600)" }}>404</h1>
              <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>Page Not Found</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "0 0 20px 0" }}>
                The page or institutional resource you are looking for does not exist or has been moved.
              </p>
              <Link to="/" className="btn btn-primary btn-sm">
                Return to Campus Portal
              </Link>
            </div>
          </div>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
