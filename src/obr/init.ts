import "./init.scss";
import OBR from "@owlbear-rodeo/sdk";

const ID = "com.bitperfect-software.hp-tracker";

const setupContextMenu = async () => {
  OBR.player;
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
      console.log(context);
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
  setupContextMenu();
});
