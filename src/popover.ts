import ReactDOM from "react-dom/client";
import React from "react";
import "./_css/main.scss";
import { Popover } from "./components/popover/Popover.tsx";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(Popover));
