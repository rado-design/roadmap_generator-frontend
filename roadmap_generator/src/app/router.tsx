import { createBrowserRouter } from "react-router";
import { HomePage } from "../pages/home";
import { RegisterPage } from "../pages/register";
import { LoginPage } from "../pages/login";
import { ForgotPasswordPage } from "../pages/forgot-password";
import { VerifyOtpPage } from "../pages/verify-otp";
import { NotFoundPage } from "../pages/not-found";
import { DashboardPage } from "../pages/dashboard";
import { RoadmapsPage } from "../pages/roadmaps";
import { RoadmapDetailPage } from "../pages/roadmap-detail";
import { PublicOnlyRoute, RequireAuthRoute } from "./RouteGuards";

export const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: (
      <RequireAuthRoute>
        <DashboardPage />
      </RequireAuthRoute>
    ),
  },
  {
    path: "/roadmaps",
    element: (
      <RequireAuthRoute>
        <RoadmapsPage />
      </RequireAuthRoute>
    ),
  },
  {
    path: "/roadmaps/:roadmapId",
    element: (
      <RequireAuthRoute>
        <RoadmapDetailPage />
      </RequireAuthRoute>
    ),
  },
  {
    path: "/",
    element: (
      <PublicOnlyRoute>
        <HomePage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicOnlyRoute>
        <ForgotPasswordPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/verify-otp",
    element: (
      <PublicOnlyRoute>
        <VerifyOtpPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/activate-account",
    element: (
      <PublicOnlyRoute>
        <VerifyOtpPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

