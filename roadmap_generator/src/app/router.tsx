import { createBrowserRouter } from "react-router";
import { HomePage } from "../pages/home";
import { RegisterPage } from "../pages/register";
import { LoginPage } from "../pages/login";
import { VerifyOtpPage } from "../pages/verify-otp";
import { NotFoundPage } from "../pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtpPage />,
  },
  {
    path: "/activate-account",
    element: <VerifyOtpPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

