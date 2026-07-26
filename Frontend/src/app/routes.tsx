import { Navigate, createBrowserRouter } from "react-router";
import Root from "./Root";
import Landing from "../pages/public/Landing";
import AdminLoginPage from "../pages/auth/AdminLoginPage";
import AdminDashboard from "../pages/admin/AdminDashboardPage";
import AdminVerificationPage from "../pages/admin/AdminVerificationPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import Register from "../pages/auth/Register";
import PublicProfilePage from "../pages/public/PublicProfilePage";
import PublicBrowseJobsPage from "../pages/public/PublicBrowseJobsPage";
import AdminJobsPage from "../pages/admin/AdminJobsPage";
import Login from "../pages/auth/Login";
import ForgotPasswordPage from "../pages/auth/ForgotPassword";
import ResetPasswordPage from "../pages/auth/ResetPassword";
import VerifyEmailPage from "../pages/auth/VerifyEmail";
import StudentDashboard from "../pages/student/StudentDashboardPage";
import ClientDashboard from "../pages/client/ClientDashboardPage";
import StudentProfilePage from "../pages/student/StudentProfilePage";
import PostJobPage from "../pages/client/PostJobPage";
import BrowseJobsPage from "../pages/student/BrowseJobsPage";
import MyApplicationsPage from "../pages/student/MyApplicationsPage";
import StudentProjectsPage from "../pages/student/StudentProjectsPage";
import ClientProjectsPage from "../pages/client/ClientProjectsPage";
import ProjectWorkspacePage from "../pages/client/ProjectWorkspacePage";
import ManageJobsPage from "../pages/client/ManageJobsPage";
import StudentSettingsPage from "../pages/student/StudentSettingsPage";
import ClientSettingsPage from "../pages/client/ClientSettingsPage";
import AuthenticationGuard from "./auth/AuthenticationGuard";
import PublicAuthGuard from "./auth/PublicAuthGuard";

/**
 * Central route table for public pages, protected dashboards, and admin views.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "p/:username", Component: PublicProfilePage },
      { path: "browse", Component: PublicBrowseJobsPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password/:token", Component: ResetPasswordPage },
      { path: "verify-email", Component: VerifyEmailPage },
      {
        path: "register",
        element: (
          <PublicAuthGuard page="register">
            <Register />
          </PublicAuthGuard>
        ),
      },
      {
        path: "login",
        element: (
          <PublicAuthGuard page="login">
            <Login />
          </PublicAuthGuard>
        ),
      },
      {
        path: "dashboard/student",
        element: (
          <AuthenticationGuard allowedRole="student">
            <StudentDashboard />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/client",
        element: (
          <AuthenticationGuard allowedRole="client">
            <ClientDashboard />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/profile",
        element: (
          <AuthenticationGuard allowedRole="student">
            <StudentProfilePage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/client/post-job",
        element: (
          <AuthenticationGuard allowedRole="client">
            <PostJobPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/browse-jobs",
        element: (
          <AuthenticationGuard allowedRole="student">
            <BrowseJobsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/browse-jobs/:jobId",
        element: (
          <AuthenticationGuard allowedRole="student">
            <BrowseJobsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/applications",
        element: (
          <AuthenticationGuard allowedRole="student">
            <MyApplicationsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/client/manage-jobs",
        element: (
          <AuthenticationGuard allowedRole="client">
            <ManageJobsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/projects",
        element: (
          <AuthenticationGuard allowedRole="student">
            <StudentProjectsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/client/projects",
        element: (
          <AuthenticationGuard allowedRole="client">
            <ClientProjectsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/settings",
        element: (
          <AuthenticationGuard allowedRole="student">
            <StudentSettingsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/client/settings",
        element: (
          <AuthenticationGuard allowedRole="client">
            <ClientSettingsPage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/student/projects/:id",
        element: (
          <AuthenticationGuard allowedRole="student">
            <ProjectWorkspacePage />
          </AuthenticationGuard>
        ),
      },
      {
        path: "dashboard/client/projects/:id",
        element: (
          <AuthenticationGuard allowedRole="client">
            <ProjectWorkspacePage />
          </AuthenticationGuard>
        ),
      },
    ],
  },
  { path: "admin", element: <Navigate to="/admin/dashboard" replace /> },
  { path: "admin/login", Component: AdminLoginPage },
  {
    path: "admin/dashboard",
    element: (
      <AuthenticationGuard allowedRole="admin">
        <AdminDashboard />
      </AuthenticationGuard>
    ),
  },
  {
    path: "admin/students",
    element: (
      <AuthenticationGuard allowedRole="admin">
        <AdminVerificationPage />
      </AuthenticationGuard>
    ),
  },
  {
    path: "admin/users",
    element: (
      <AuthenticationGuard allowedRole="admin">
        <AdminUsersPage />
      </AuthenticationGuard>
    ),
  },
  {
    path: "admin/jobs",
    element: (
      <AuthenticationGuard allowedRole="admin">
        <AdminJobsPage />
      </AuthenticationGuard>
    ),
  },
  {
    path: "admin/reports",
    element: (
      <AuthenticationGuard allowedRole="admin">
        <AdminReportsPage />
      </AuthenticationGuard>
    ),
  },
  {
    path: "admin/settings",
    element: (
      <AuthenticationGuard allowedRole="admin">
        <AdminSettingsPage />
      </AuthenticationGuard>
    ),
  },
]);
