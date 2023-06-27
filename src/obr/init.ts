import "./init.scss";
import OBR from "@owlbear-rodeo/sdk";
import { ID } from "../helper/variables.ts";

const initItems = async () => {
  return OBR.scene.items.updateItems(
    (item) => item.layer === "CHARACTER",
    (items) => {
      items.forEach((item) => {
        item.metadata[`${ID}/data`] = {
          name: "",
          hp: 0,
          maxHp: 0,
          hpTrackerActive: false,
        };
      });
    }
  );
};

const setupContextMenu = async () => {
  return OBR.contextMenu.create({
    id: `${ID}/tool`,
    icons: [
      {
        icon: "/icon.svg",
        label: "HP Tracker",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
          roles: ["GM"],
        },
      },
    ],
    onClick: (context, elementId) => {
      OBR.popover.open({
        id: "rodeo.owlbear.example/popover",
        url: `/popover.html?id=${context.items[0].id}`,
        height: 80,
        width: 400,
        anchorElementId: elementId,
      });
    },
  });
};

OBR.onReady(async () => {
  initItems();
  setupContextMenu();
});
