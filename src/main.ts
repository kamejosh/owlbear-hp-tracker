import ReactDOM from "react-dom/client";
import React from "react";
import { HPTracker } from "./components/HPTracker.tsx";
import "./main.scss";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(HPTracker));
