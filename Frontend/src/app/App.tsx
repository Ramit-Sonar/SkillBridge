import { RouterProvider } from "react-router";
import { router } from "./routes";

/**
 * Mounts the application router.
 */
export default function App() {
  return <RouterProvider router={router} />;
}
