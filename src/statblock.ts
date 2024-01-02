import ReactDOM from "react-dom/client";
import React from "react";
import "./main.scss";
import { StatblockPopover } from "./components/statblock/StatblockPopover.tsx";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(StatblockPopover));
