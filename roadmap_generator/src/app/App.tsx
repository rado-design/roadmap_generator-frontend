import { RouterProvider } from "react-router";
import { Providers } from "./providers";
import { SessionBootstrap } from "./SessionBootstrap";
import { router } from "./router";

function App() {
  return (
    <Providers>
      <SessionBootstrap>
        <RouterProvider router={router} />
      </SessionBootstrap>
    </Providers>
  );
}

export default App;
