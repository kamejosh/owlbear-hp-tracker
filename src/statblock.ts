import ReactDOM from "react-dom/client";
import React from "react";
import "./_css/main.scss";
import { StatblockPopover } from "./components/statblock/StatblockPopover.tsx";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(StatblockPopover));
