import { createBrowserRouter } from "react-router";
import { HomePage } from "../pages/home";
import { RegisterPage } from "../pages/register";
import { NotFoundPage } from "../pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
