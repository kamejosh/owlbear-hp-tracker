import ReactDOM from "react-dom/client";
import React from "react";
import "./_css/main.scss";
import { RollLogPopover } from "./components/popover/RolllogPopover.tsx";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(RollLogPopover));
