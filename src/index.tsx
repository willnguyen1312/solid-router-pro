/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import Home from "./routes/Home.tsx";

render(
  () => (
    <Router>
      <Route path="/" component={Home} />
    </Router>
  ),
  document.getElementById("root")!
);
