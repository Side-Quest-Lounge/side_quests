"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Button, Pill } from "@/components/ui";
import type { OpenQuest } from "@/context/open-quests";
import { formatOpenQuestDateShort } from "@/lib/open-quest-utils";
import { openQuestChatPath } from "@/lib/paths";

type OpenQuestTileProps = {
  quest: OpenQuest;
  highlighted?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  style?: CSSProperties;
  className?: string;
};

export function OpenQuestTile({
  quest,
  highlighted = false,
  onJoin,
  onLeave,
  style,
  className = "",
}: OpenQuestTileProps) {
  const spotsTone = quest.spotsLeft <= 2 ? "coral" : "success";

  return (
    <article
      className={`open-quest-tile${quest.joined ? " is-joined" : ""}${highlighted ? " is-highlighted" : ""} ${className}`.trim()}
      style={style}
    >
      <div className="open-quest-tile__header">
        <span className="open-quest-tile__emoji" aria-hidden>
          {quest.emoji}
        </span>
        <div className="open-quest-tile__badges">
          {quest.joined && (
            <Pill tone="sunny" className="open-quest-tile__joined-pill">
              You&apos;re in
            </Pill>
          )}
          <Pill tone={spotsTone} className="open-quest-tile__spots">
            {quest.spotsLeft} {quest.spotsLeft === 1 ? "spot" : "spots"} left
          </Pill>
        </div>
      </div>

      <h3 className="open-quest-tile__title">{quest.title}</h3>
      <p className="open-quest-tile__when">{formatOpenQuestDateShort(quest.startsAt)}</p>
      <p className="open-quest-tile__venue">{quest.venue}</p>

      <div className="open-quest-tile__footer">
        {quest.joined ? (
          <div className="open-quest-tile__actions open-quest-tile__actions--row">
            <Link href={openQuestChatPath(quest.id)} className="open-quest-tile__action-link">
              <Button variant="primary" className="open-quest-tile__btn">
                Party chat →
              </Button>
            </Link>
            {onLeave && (
              <Button variant="ghost" type="button" className="open-quest-tile__btn" onClick={onLeave}>
                Leave
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="accent"
            type="button"
            className="open-quest-tile__btn"
            onClick={onJoin}
            disabled={!onJoin || quest.spotsLeft <= 0}
          >
            {quest.spotsLeft <= 0 ? "Full" : "Join this quest →"}
          </Button>
        )}
      </div>
    </article>
  );
}
