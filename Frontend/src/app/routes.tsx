import { lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import Root from "./Root";
import AuthenticationGuard from "./auth/AuthenticationGuard";
import PublicAuthGuard from "./auth/PublicAuthGuard";

const Landing = lazy(() => import("../pages/public/Landing"));
const AdminLoginPage = lazy(() => import("../pages/auth/AdminLoginPage"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminVerificationPage = lazy(() => import("../pages/admin/AdminVerificationPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminReportsPage = lazy(() => import("../pages/admin/AdminReportsPage"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage"));
const Register = lazy(() => import("../pages/auth/Register"));
const PublicProfilePage = lazy(() => import("../pages/public/PublicProfilePage"));
const PublicBrowseJobsPage = lazy(() => import("../pages/public/PublicBrowseJobsPage"));
const MaintenancePage = lazy(() => import("../pages/public/MaintenancePage"));
const AdminJobsPage = lazy(() => import("../pages/admin/AdminJobsPage"));
const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPassword"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmail"));
const StudentDashboard = lazy(() => import("../pages/student/StudentDashboardPage"));
const ClientDashboard = lazy(() => import("../pages/client/ClientDashboardPage"));
const StudentProfilePage = lazy(() => import("../pages/student/StudentProfilePage"));
const PostJobPage = lazy(() => import("../pages/client/PostJobPage"));
const BrowseJobsPage = lazy(() => import("../pages/student/BrowseJobsPage"));
const MyApplicationsPage = lazy(() => import("../pages/student/MyApplicationsPage"));
const StudentProjectsPage = lazy(() => import("../pages/student/StudentProjectsPage"));
const ClientProjectsPage = lazy(() => import("../pages/client/ClientProjectsPage"));
const ProjectWorkspacePage = lazy(() => import("../pages/client/ProjectWorkspacePage"));
const ManageJobsPage = lazy(() => import("../pages/client/ManageJobsPage"));
const StudentSettingsPage = lazy(() => import("../pages/student/StudentSettingsPage"));
const ClientSettingsPage = lazy(() => import("../pages/client/ClientSettingsPage"));

/**
 * Central route table for public pages, protected dashboards, and admin views.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "maintenance", Component: MaintenancePage },
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
