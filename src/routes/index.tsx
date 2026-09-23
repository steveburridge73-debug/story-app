import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BottomNav, PhoneShell } from "@/components/chrome";
import { HomeScreen } from "@/components/home-screen";
import { LockScreen } from "@/components/lock-screen";
import { ConfirmModal } from "@/components/ui";
import { StoriesHub, StoriesList, StoryDetail, StoryEdit, StoryImport } from "@/components/stories-screens";
import { StoryNewScreen } from "@/components/story-new-screen";
import { StoryReader } from "@/components/reader-screen";
import { CharactersList, CharacterDetail, CharacterEdit } from "@/components/characters-screens";
import { ScenariosList, ScenarioDetail, ScenarioEdit } from "@/components/scenarios-screens";
import { SeriesList, SeriesDetail, SeriesReader, SeriesContinue } from "@/components/series-screens";
import { ReplacementScreen } from "@/components/replacement-screen";
import { GenerationScreen } from "@/components/generation-screen";
import { DynamicsScreen, LuckyDipScreen } from "@/components/dynamics-screens";
import { LinksHub, LinksList, LinkEdit, PornMagsScreen } from "@/components/links-screens";
import { SearchScreen, FavouritesScreen, RecentsScreen } from "@/components/find-screens";
import { AudiobookDock, AudiobooksList } from "@/components/audiobook-screens";
import {
  SettingsScreen,
  PasscodeScreen,
  CategoriesScreen,
  TagsScreen,
  HealthScreen,
  RulesScreen,
  BackupScreen,
  SyncScreen,
} from "@/components/settings-screens";
import { autoLockMs, currentView, useApp } from "@/lib/store";
import { syncManager } from "@/lib/sync/manager";
import type { ViewName } from "@/lib/library/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const unlocked = useApp((s) => s.unlocked);
  const hydrate = useApp((s) => s.hydrate);
  const hydrated = useApp((s) => s.hydrated);
  const touch = useApp((s) => s.touch);
  const lock = useApp((s) => s.lock);
  const lastActivity = useApp((s) => s.lastActivity);
  const autoLock = useApp((s) => s.lib.settings.autoLock);
  const confirm = useApp((s) => s.confirm);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const frame = useApp((s) => currentView(s.nav));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Once the local library is loaded, start background cloud sync if this
  // device has previously been linked to a sync code.
  useEffect(() => {
    if (hydrated) syncManager.init();
  }, [hydrated]);

  useEffect(() => {
    if (!unlocked) return;
    const onActivity = () => touch();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    const onVis = () => {
      if (document.hidden && autoLock === "immediate") lock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [unlocked, autoLock, touch, lock]);

  useEffect(() => {
    if (!unlocked) return;
    const ms = autoLockMs(autoLock);
    if (ms == null) return;
    const id = window.setInterval(() => {
      if (Date.now() - useApp.getState().lastActivity >= ms) {
        useApp.getState().lock();
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [unlocked, autoLock, lastActivity]);

  if (!unlocked) {
    return <LockScreen />;
  }

  return (
    <PhoneShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <ActiveView view={frame.view} />
      </div>
      <AudiobookDock />
      <BottomNav />
      {confirm ? (
        <ConfirmModal
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={closeConfirm}
        />
      ) : null}
    </PhoneShell>
  );
}

function ActiveView({ view }: { view: ViewName }) {
  switch (view) {
    case "home":
      return <HomeScreen />;
    case "stories":
      return <StoriesHub />;
    case "stories-list":
      return <StoriesList />;
    case "story":
      return <StoryDetail />;
    case "story-edit":
      return <StoryEdit />;
    case "story-reader":
      return <StoryReader />;
    case "story-import":
      return <StoryImport />;
    case "story-new":
      return <StoryNewScreen />;
    case "audiobooks":
      return <AudiobooksList />;
    case "characters":
      return <CharactersList />;
    case "character":
      return <CharacterDetail />;
    case "character-edit":
      return <CharacterEdit />;
    case "scenarios":
      return <ScenariosList />;
    case "scenario":
      return <ScenarioDetail />;
    case "scenario-edit":
      return <ScenarioEdit />;
    case "series":
      return <SeriesList />;
    case "series-detail":
      return <SeriesDetail />;
    case "series-reader":
      return <SeriesReader />;
    case "series-continue":
      return <SeriesContinue />;
    case "replacement":
      return <ReplacementScreen />;
    case "generation":
      return <GenerationScreen />;
    case "dynamics":
      return <DynamicsScreen />;
    case "lucky-dip":
      return <LuckyDipScreen />;
    case "links":
      return <LinksHub />;
    case "links-list":
      return <LinksList />;
    case "porn-mags":
      return <PornMagsScreen />;
    case "link-edit":
      return <LinkEdit />;
    case "search":
      return <SearchScreen />;
    case "favourites":
      return <FavouritesScreen />;
    case "recents":
      return <RecentsScreen />;
    case "settings":
      return <SettingsScreen />;
    case "categories":
      return <CategoriesScreen />;
    case "tags":
      return <TagsScreen />;
    case "health":
      return <HealthScreen />;
    case "rules":
      return <RulesScreen />;
    case "passcode":
      return <PasscodeScreen />;
    case "backup":
      return <BackupScreen />;
    case "sync":
      return <SyncScreen />;
    default:
      return <HomeScreen />;
  }
}
