import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

/**
 * Mounts the application router.
 */
export default function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
