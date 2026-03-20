import { Home, Rocket, Bus, Gavel, Store, Mic } from "lucide-react";
import type React from "react";

import openHouseLogo from "@/assets/event-logos/open-house.png";
import projectLaunchLogo from "@/assets/event-logos/project-launch.png";
import viewingTourLogo from "@/assets/event-logos/viewing-tour.png";
import auctionLogo from "@/assets/event-logos/auction.png";
import exhibitionLogo from "@/assets/event-logos/exhibition.png";
import seminarConferenceLogo from "@/assets/event-logos/seminar-conference.png";

export const eventTypes = [
  { value: "open_house", label: "Open House" },
  { value: "project_launch", label: "Project Launch" },
  { value: "viewing_tour", label: "Viewing Tour" },
  { value: "auction", label: "Auction" },
  { value: "exhibition", label: "Exhibition/Trade Show" },
  { value: "seminar_conference", label: "Seminar/Conference" },
];

export const defaultEventLogos: Record<string, string> = {
  open_house: openHouseLogo,
  project_launch: projectLaunchLogo,
  viewing_tour: viewingTourLogo,
  auction: auctionLogo,
  exhibition: exhibitionLogo,
  seminar_conference: seminarConferenceLogo,
};

export const eventTypeIcons: Record<string, React.ElementType> = {
  open_house: Home,
  project_launch: Rocket,
  viewing_tour: Bus,
  auction: Gavel,
  exhibition: Store,
  seminar_conference: Mic,
};

/** Returns the Lucide icon component for a given event type */
export function getEventTypeIcon(eventType: string): React.ElementType {
  return eventTypeIcons[eventType] || Home;
}

/** Returns the event logo URL – uploaded logo if available, otherwise the generic one for that type */
export function getEventLogo(logoUrl: string | null | undefined, eventType: string): string {
  if (logoUrl) return logoUrl;
  return defaultEventLogos[eventType] || defaultEventLogos.open_house;
}
