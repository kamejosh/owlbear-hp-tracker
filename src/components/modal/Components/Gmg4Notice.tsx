import OBR from "@owlbear-rodeo/sdk";
import { gmg4NoticeModal } from "../../../helper/variables.ts";

export const Gmg4Notice = () => {
  return (
    <>
      <button className={"close-button"} onClick={async () => await OBR.modal.close(gmg4NoticeModal.id)}>
        X
      </button>
      <h1>GM's Grimoire 4.0 is coming</h1>
      <p>
        On <strong>November 9th</strong> GM's Grimoire 4.0 will replace the current version (3.7). It has been
        rebuilt from scratch and runs on a completely new backend.
      </p>
      <p>
        Your data is migrated automatically, including your account on the new backend with all your statblocks,
        spells, items and characters. The only thing you need to do is log into your Tabletop Almanac account in
        the new GMG to access your custom content.
      </p>
      <p>
        Pathfinder 2e support is removed from GMG, but a new standalone Pathfinder extension will be released on
        the same day (Game Master's Pathfinder).
      </p>
      <p>Watch the video to see what changes in the new version:</p>
      <p>
        Questions? Join us on{" "}
        <a href={"https://discord.gg/EMg7pRQ5Fm"} target={"_blank"}>
          Discord
        </a>{" "}
        or{" "}
        <a href={"https://www.reddit.com/r/tabletopalmanac/"} target={"_blank"}>
          Reddit
        </a>
        .
      </p>
      <iframe
        width={"100%"}
        style={{ aspectRatio: "16 / 9", border: 0 }}
        src={"https://www.youtube.com/embed/KR4iyedauYg"}
        title={"GM's Grimoire 4.0"}
        allow={"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"}
        allowFullScreen
      />
    </>
  );
};
