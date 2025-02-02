import ReactDOM from "react-dom/client";
import React from "react";
import { GMGrimoire } from "./components/gmgrimoire/GMGrimoire.tsx";
import "./_css/main.scss";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(GMGrimoire));
